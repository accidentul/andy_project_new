import { BaseAgent, AgentContext, AgentAction } from './base.agent'

export class CEOAgent extends BaseAgent {
  constructor() {
    super('CEO')
  }

  protected buildSystemPrompt(): string {
    return `You are an AI assistant specialized for C-level executives and CEOs.
    
Your focus areas:
- Strategic planning and company-wide performance
- Board reporting and stakeholder management
- Market positioning and competitive analysis
- High-level financial metrics and growth indicators
- Risk management and opportunity identification
- Merger & acquisition opportunities
- Organizational health and culture metrics

Communication style:
- Executive-level summaries with key insights upfront
- Focus on strategic impact and ROI
- Data-driven recommendations with clear business cases
- Highlight critical risks and opportunities
- Provide actionable intelligence for board presentations

Always consider:
- Multi-year trends and forecasts
- Industry benchmarks and competitive positioning
- Cross-functional dependencies and synergies
- Regulatory and compliance implications`
  }

  protected extractBusinessContext(data: any): string {
    if (!data) return 'No business data available'

    const context = []
    
    // Revenue metrics
    if (data.revenue) {
      context.push(`Current Revenue: $${data.revenue.current}M (${data.revenue.growth}% YoY)`)
    }
    
    // Company performance
    if (data.performance) {
      context.push(`Company Performance Score: ${data.performance.overall}/100`)
      context.push(`Market Share: ${data.performance.marketShare}%`)
    }
    
    // Subsidiary performance
    if (data.subsidiaries) {
      const topPerformer = data.subsidiaries.reduce((a: any, b: any) => a.revenue > b.revenue ? a : b, { revenue: 0 })
      context.push(`Top Subsidiary: ${topPerformer.name} ($${topPerformer.revenue}M)`)
    }
    
    // Strategic initiatives
    if (data.initiatives) {
      context.push(`Active Strategic Initiatives: ${data.initiatives.length}`)
    }

    return context.join('\n')
  }

  protected generateActions(context: AgentContext, analysis: string): AgentAction[] {
    const actions: AgentAction[] = []

    // Board presentation action
    if (analysis.toLowerCase().includes('board') || analysis.toLowerCase().includes('presentation')) {
      actions.push({
        type: 'automation',
        title: 'Generate Board Presentation',
        description: 'Auto-generate executive presentation with latest metrics and strategic updates',
        impact: 'Save 4-6 hours of preparation time',
        requiresApproval: false,
        actionData: {
          template: 'executive_board',
          includeMetrics: true,
          includeForecast: true,
        }
      })
    }

    // Strategic alert
    if (analysis.toLowerCase().includes('risk') || analysis.toLowerCase().includes('threat')) {
      actions.push({
        type: 'alert',
        title: 'Strategic Risk Alert',
        description: 'Critical risk identified requiring executive attention',
        impact: 'Potential impact on company valuation',
        requiresApproval: false,
        actionData: {
          severity: 'high',
          notifyBoard: true,
        }
      })
    }

    // M&A opportunity
    if (analysis.toLowerCase().includes('acquisition') || analysis.toLowerCase().includes('merger')) {
      actions.push({
        type: 'recommendation',
        title: 'M&A Opportunity Analysis',
        description: 'Potential acquisition target identified based on strategic fit',
        impact: 'Estimated 15-20% market share increase',
        requiresApproval: true,
        actionData: {
          type: 'acquisition',
          estimatedValue: '$50-75M',
        }
      })
    }

    return actions
  }

  async processQuery(query: string, context: AgentContext): Promise<import("./base.agent").AgentResponse> {
    const analysis = `As CEO, analyzing: ${query}\n\nBased on current metrics: ${this.extractBusinessContext(context.businessData)}`
    const actions = this.generateActions(context, analysis)
    
    return {
      content: analysis,
      actions,
      suggestions: [],
      confidence: 0.85
    }
  }
}