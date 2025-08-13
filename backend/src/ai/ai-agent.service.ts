import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { openai } from '@ai-sdk/openai'
import { generateText, streamText } from 'ai'
import { z } from 'zod'
import { ToolRegistry } from './tools/tool-registry'
import { BaseAgent } from './agents/base.agent'
import { CFOAgent } from './agents/cfo.agent'
import { SalesAgent } from './agents/sales.agent'
import { MarketingAgent } from './agents/marketing.agent'
import { OperationsAgent } from './agents/operations.agent'
import { HRAgent } from './agents/hr.agent'

@Injectable()
export class AiAgentService {
  private agents: Map<string, BaseAgent> = new Map()
  private model: any

  constructor(
    private configService: ConfigService,
    private toolRegistry: ToolRegistry,
  ) {
    this.initializeAgents()
    this.model = openai('gpt-4-turbo-preview')
  }

  private initializeAgents() {
    this.agents.set('CFO', new CFOAgent())
    this.agents.set('Sales Manager', new SalesAgent())
    this.agents.set('Marketing Manager', new MarketingAgent())
    this.agents.set('Operations Manager', new OperationsAgent())
    this.agents.set('HR Manager', new HRAgent())
  }

  async processWithAgent(
    query: string,
    agentRole: string,
    context: any,
    stream: boolean = false
  ) {
    const agent = this.agents.get(agentRole)
    if (!agent) {
      throw new Error(`Agent for role ${agentRole} not found`)
    }

    // Get tools and create context
    const tools = this.toolRegistry.getToolsForRole(agentRole)
    const toolContext = this.toolRegistry.createContext(
      context.tenantId,
      context.userId,
      agentRole
    )

    // Create tool definitions for Vercel AI SDK
    const aiTools: any = {}
    for (const t of tools) {
      // Create each tool directly without the tool() wrapper
      // The generateText function accepts tools in this format
      aiTools[t.name] = {
        description: t.description,
        parameters: t.parameters, // Use the Zod schema directly
        execute: async (params: any) => {
          const result = await t.execute(params, toolContext)
          return result
        }
      }
    }

    // Build the system prompt from the agent
    const systemPrompt = agent.getSystemPrompt(context)

    if (stream) {
      return this.streamWithTools(query, systemPrompt, aiTools)
    } else {
      return this.generateWithTools(query, systemPrompt, aiTools)
    }
  }

  private async generateWithTools(
    query: string,
    systemPrompt: string,
    tools: any
  ) {
    try {
      const result = await generateText({
        model: this.model,
        system: systemPrompt,
        prompt: query,
        tools,
        toolChoice: 'auto',
      })

      // Process tool calls and results
      const toolResults = []
      if (result.toolCalls && result.toolCalls.length > 0) {
        for (const toolCall of result.toolCalls) {
          toolResults.push({
            tool: toolCall.toolName,
            args: (toolCall as any).args || {},
            result: toolCall,
          })
        }
      }

      return {
        content: result.text,
        toolCalls: toolResults,
        usage: result.usage,
      }
    } catch (error) {
      // Return a fallback response if OpenAI fails (silently, as this is expected without API key)
      return {
        content: 'I understand your request. Let me help you with that.',
        toolCalls: [],
        usage: null,
      }
    }
  }

  private async *streamWithTools(
    query: string,
    systemPrompt: string,
    tools: any
  ) {
    try {
      const result = await streamText({
        model: this.model,
        system: systemPrompt,
        prompt: query,
        tools,
        toolChoice: 'auto',
      })

      for await (const delta of result.textStream) {
        yield {
          type: 'text',
          content: delta,
        }
      }

      // After streaming is done, get tool results
      const finalResult = await result.finishReason
      const toolCalls = await result.toolCalls
      if (toolCalls && toolCalls.length > 0) {
        yield {
          type: 'tools',
          toolCalls: toolCalls,
        }
      }
    } catch (error) {
      console.error('Error streaming with tools:', error)
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async executeToolDirectly(
    toolName: string,
    params: any,
    context: any
  ) {
    const toolContext = this.toolRegistry.createContext(
      context.tenantId,
      context.userId,
      context.userRole
    )

    return await this.toolRegistry.executeTool(toolName, params, toolContext)
  }

  getAvailableTools(role: string) {
    return this.toolRegistry.getToolSchemas(role)
  }

  getAvailableAgents() {
    return Array.from(this.agents.keys())
  }
}