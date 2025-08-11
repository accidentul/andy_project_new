import { ChatOpenAI } from '@langchain/openai'
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ConversationSummaryMemory } from 'langchain/memory'
import { User } from '../../users/user.entity'

export interface AgentContext {
  user: User
  tenantId: string
  conversation: BaseMessage[]
  businessData?: any
}

export interface AgentResponse {
  content: string
  suggestions?: string[]
  actions?: AgentAction[]
  visualizations?: any[]
  confidence: number
}

export interface AgentAction {
  type: 'automation' | 'alert' | 'recommendation'
  title: string
  description: string
  impact: string
  requiresApproval: boolean
  actionData?: any
}

export abstract class BaseAgent {
  protected llm: ChatOpenAI
  protected memory: ConversationSummaryMemory
  protected role: string
  protected systemPrompt: string

  constructor(role: string) {
    this.role = role
    this.systemPrompt = this.buildSystemPrompt()
    
    this.llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
      streaming: true,
    })

    this.memory = new ConversationSummaryMemory({
      llm: this.llm,
      memoryKey: 'chat_history',
      returnMessages: true,
    })
  }

  protected abstract buildSystemPrompt(): string

  protected abstract extractBusinessContext(data: any): string

  protected abstract generateActions(context: AgentContext, analysis: string): AgentAction[]

  async processQuery(query: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Build context-aware prompt
      const businessContext = this.extractBusinessContext(context.businessData)
      
      const messages = [
        new SystemMessage(this.systemPrompt),
        new SystemMessage(`Business Context:\n${businessContext}`),
        new SystemMessage(`User Role: ${context.user.role?.name || 'Unknown'}`),
        new SystemMessage(`Department: ${(context.user as any).department || 'General'}`),
        ...context.conversation,
        new HumanMessage(query),
      ]

      // Get LLM response
      const response = await this.llm.invoke(messages)
      const content = response.content.toString()

      // Generate role-specific actions
      const actions = this.generateActions(context, content)

      // Save to memory
      await this.memory.saveContext(
        { input: query },
        { output: content }
      )

      return {
        content,
        actions,
        suggestions: this.extractSuggestions(content),
        confidence: this.calculateConfidence(content),
      }
    } catch (error) {
      console.error(`Agent ${this.role} error:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to process query: ${errorMessage}`)
    }
  }

  protected extractSuggestions(content: string): string[] {
    // Extract actionable suggestions from the response
    const suggestions: string[] = []
    const lines = content.split('\n')
    
    for (const line of lines) {
      if (line.includes('recommend') || line.includes('suggest') || line.includes('should')) {
        suggestions.push(line.trim())
      }
    }
    
    return suggestions.slice(0, 3) // Limit to top 3 suggestions
  }

  protected calculateConfidence(content: string): number {
    // Simple confidence calculation based on response quality indicators
    let confidence = 0.5
    
    if (content.includes('based on')) confidence += 0.1
    if (content.includes('data shows')) confidence += 0.1
    if (content.includes('analysis')) confidence += 0.1
    if (content.includes('trend')) confidence += 0.1
    if (content.length > 200) confidence += 0.1
    
    return Math.min(confidence, 1.0)
  }

  async clearMemory(): Promise<void> {
    await this.memory.clear()
  }
}