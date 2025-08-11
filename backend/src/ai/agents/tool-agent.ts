import { ChatOpenAI } from '@langchain/openai'
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { AIMessage, HumanMessage, BaseMessage } from '@langchain/core/messages'
import { DynamicStructuredTool, DynamicTool } from '@langchain/core/tools'
import { Repository } from 'typeorm'
import { createCrmTools } from '../tools/crm-tools'
import { createBusinessTools } from '../tools/business-tools'
import { CrmAccount, CrmContact, CrmDeal, CrmActivity } from '../../connectors/unified-crm.entities'

export interface ToolAgentConfig {
  openAIApiKey: string
  modelName?: string
  temperature?: number
  streaming?: boolean
}

export class ToolAgent {
  private llm: ChatOpenAI
  private executor: AgentExecutor | null = null
  private tools: (DynamicStructuredTool | DynamicTool)[] = []
  
  constructor(
    private config: ToolAgentConfig,
    private accountRepo: Repository<CrmAccount>,
    private contactRepo: Repository<CrmContact>,
    private dealRepo: Repository<CrmDeal>,
    private activityRepo: Repository<CrmActivity>,
    private tenantId: string,
    private userRole: string = 'User'
  ) {
    this.llm = new ChatOpenAI({
      openAIApiKey: config.openAIApiKey,
      modelName: config.modelName || 'gpt-4-turbo-preview',
      temperature: config.temperature || 0.7,
      streaming: config.streaming || false
    })
    
    this.initializeTools()
  }
  
  private initializeTools() {
    // Add CRM tools
    const crmTools = createCrmTools(
      this.accountRepo,
      this.contactRepo,
      this.dealRepo,
      this.activityRepo,
      this.tenantId
    )
    
    // Add business tools
    const businessTools = createBusinessTools(
      this.dealRepo,
      this.accountRepo,
      this.contactRepo,
      this.activityRepo,
      this.tenantId
    )
    
    this.tools = [...crmTools, ...businessTools]
    
    // Add a calculator tool as an example
    this.tools.push(
      new DynamicTool({
        name: 'calculator',
        description: 'Useful for mathematical calculations',
        func: async (input: string) => {
          try {
            // Simple eval for demo - in production use a proper math parser
            const result = Function('"use strict"; return (' + input + ')')()
            return String(result)
          } catch (error) {
            return 'Invalid calculation'
          }
        }
      })
    )
  }
  
  async initialize() {
    // Create the prompt template with role-specific instructions
    const systemPrompt = this.getSystemPrompt()
    
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad')
    ])
    
    // Create the agent
    const agent = await createOpenAIFunctionsAgent({
      llm: this.llm,
      tools: this.tools,
      prompt
    })
    
    // Create the executor
    this.executor = new AgentExecutor({
      agent,
      tools: this.tools,
      verbose: true,
      maxIterations: 5,
      returnIntermediateSteps: true
    })
  }
  
  private getSystemPrompt(): string {
    const rolePrompts: Record<string, string> = {
      'CEO': `You are an AI assistant for a CEO. Focus on:
- Strategic insights and high-level metrics
- Board reporting and stakeholder management
- Revenue and growth analysis
- Risk identification and mitigation
- M&A opportunities and market positioning

Always use the available tools to get real data before making recommendations.
When asked about metrics, ALWAYS use get_revenue_metrics or analyze_performance tools.
When asked for reports, use generate_board_presentation or generate_sales_report tools.`,
      
      'Sales': `You are an AI assistant for a Sales Manager. Focus on:
- Pipeline management and deal velocity
- Win rate optimization
- Account and contact management
- Activity tracking and engagement
- Sales forecasting and quota attainment

Always use the available tools to get real data.
Use search_deals to find specific opportunities.
Use create_deal or update_deal_stage to manage pipeline.
Use calculate_forecast for predictions.`,
      
      'Marketing': `You are an AI assistant for a Marketing Manager. Focus on:
- Lead generation and conversion
- Campaign performance
- Contact database management
- Market segmentation
- ROI analysis

Use search_contacts and create_contact for lead management.
Use get_account_metrics for market analysis.
Use export_data to prepare campaign lists.`,
      
      'default': `You are an AI business assistant with access to CRM data and business tools.
Help users manage their deals, contacts, and generate reports.

Available capabilities:
- Search and create deals, contacts, and activities
- Generate executive presentations and sales reports
- Export data and calculate forecasts
- Analyze performance with insights

Always use the available tools to work with real data rather than making assumptions.`
    }
    
    return rolePrompts[this.userRole] || rolePrompts['default']
  }
  
  async processQuery(
    query: string,
    chatHistory: BaseMessage[] = []
  ): Promise<{
    output: string
    intermediateSteps?: any[]
    toolsUsed: string[]
  }> {
    if (!this.executor) {
      await this.initialize()
    }
    
    try {
      const result = await this.executor!.invoke({
        input: query,
        chat_history: chatHistory
      })
      
      // Extract tools used
      const toolsUsed = result.intermediateSteps
        ? result.intermediateSteps.map((step: any) => step.action.tool)
        : []
      
      return {
        output: result.output,
        intermediateSteps: result.intermediateSteps,
        toolsUsed: Array.from(new Set(toolsUsed))
      }
    } catch (error) {
      console.error('Agent execution error:', error)
      return {
        output: 'I encountered an error processing your request. Please try again.',
        toolsUsed: []
      }
    }
  }
  
  async streamQuery(
    query: string,
    chatHistory: BaseMessage[] = [],
    onToken: (token: string) => void
  ): Promise<{
    output: string
    toolsUsed: string[]
  }> {
    if (!this.executor) {
      await this.initialize()
    }
    
    // Enable streaming on the LLM
    const streamingLLM = new ChatOpenAI({
      ...this.config,
      streaming: true,
      callbacks: [
        {
          handleLLMNewToken(token: string) {
            onToken(token)
          }
        }
      ]
    })
    
    // Create streaming agent
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', this.getSystemPrompt()],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad')
    ])
    
    const agent = await createOpenAIFunctionsAgent({
      llm: streamingLLM,
      tools: this.tools,
      prompt
    })
    
    const streamingExecutor = new AgentExecutor({
      agent,
      tools: this.tools,
      verbose: false,
      maxIterations: 5
    })
    
    try {
      const result = await streamingExecutor.invoke({
        input: query,
        chat_history: chatHistory
      })
      
      const toolsUsed = result.intermediateSteps
        ? result.intermediateSteps.map((step: any) => step.action.tool)
        : []
      
      return {
        output: result.output,
        toolsUsed: Array.from(new Set(toolsUsed))
      }
    } catch (error) {
      console.error('Streaming agent error:', error)
      return {
        output: 'Error processing request',
        toolsUsed: []
      }
    }
  }
  
  getAvailableTools(): { name: string; description: string }[] {
    return this.tools.map(tool => ({
      name: tool.name,
      description: tool.description
    }))
  }
}