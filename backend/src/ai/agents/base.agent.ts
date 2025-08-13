// Base agent without LangChain dependencies
import { User } from '../../users/user.entity'

export interface AgentContext {
  user: User
  tenantId: string
  conversation: any[]
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
  protected role: string
  protected baseSystemPrompt: string

  constructor(role: string) {
    this.role = role
    this.baseSystemPrompt = this.buildSystemPrompt()
  }

  protected abstract buildSystemPrompt(): string

  public getSystemPrompt(context?: any): string {
    if (context?.businessData) {
      return `${this.baseSystemPrompt}\n\nCurrent Business Context:\n${this.extractBusinessContext(context.businessData)}`
    }
    return this.baseSystemPrompt
  }

  protected extractBusinessContext(data: any): string {
    return JSON.stringify(data, null, 2)
  }

  abstract processQuery(query: string, context: AgentContext): Promise<AgentResponse>

  protected generateActions(context: AgentContext, analysis?: string): AgentAction[] {
    // Generate role-specific actions based on context
    const actions: AgentAction[] = []
    
    if (this.role === 'CEO' || this.role === 'Executive') {
      actions.push({
        type: 'recommendation',
        title: 'Schedule Board Review',
        description: 'Prepare executive dashboard for upcoming board meeting',
        impact: 'Ensure stakeholder alignment on key metrics',
        requiresApproval: false,
        actionData: { metrics: context.businessData?.metrics }
      })
    }
    
    if (this.role === 'Sales Manager') {
      actions.push({
        type: 'automation',
        title: 'Pipeline Alert',
        description: 'Review deals stuck in pipeline > 30 days',
        impact: 'Accelerate deal velocity by 15%',
        requiresApproval: false,
        actionData: { dealCount: context.businessData?.stalledDeals }
      })
    }
    
    return actions
  }
}