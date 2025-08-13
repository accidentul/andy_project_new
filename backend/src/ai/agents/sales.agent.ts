import { BaseAgent, AgentContext, AgentAction } from './base.agent'

export class SalesAgent extends BaseAgent {
  constructor() {
    super('Sales Manager')
  }

  protected buildSystemPrompt(): string {
    return `You are an AI assistant specialized for Sales Managers and sales teams.
    
Your focus areas:
- Sales pipeline optimization and forecasting
- Deal velocity and conversion rates
- Territory and quota management
- Customer relationship insights
- Competitive deal strategies
- Sales team performance and coaching
- Lead scoring and prioritization
- Revenue acceleration opportunities

Communication style:
- Action-oriented with specific next steps
- Focus on revenue impact and deal closure
- Provide tactical recommendations for active deals
- Highlight at-risk opportunities requiring attention
- Data-driven coaching insights for team improvement

Always consider:
- Current quarter pipeline coverage
- Win/loss analysis patterns
- Customer buying signals and engagement
- Competitive positioning in active deals
- Sales cycle optimization opportunities`
  }

  protected extractBusinessContext(data: any): string {
    if (!data) return 'No sales data available'

    const context = []
    
    // Pipeline metrics
    if (data.pipeline) {
      context.push(`Total Pipeline: $${data.pipeline.total}M`)
      context.push(`Qualified Pipeline: $${data.pipeline.qualified}M`)
      context.push(`Pipeline Coverage: ${data.pipeline.coverage}x`)
    }
    
    // Deal metrics
    if (data.deals) {
      context.push(`Active Deals: ${data.deals.count}`)
      context.push(`Average Deal Size: $${data.deals.averageSize}K`)
      context.push(`Win Rate: ${data.deals.winRate}%`)
    }
    
    // Team performance
    if (data.team) {
      context.push(`Team Quota Attainment: ${data.team.quotaAttainment}%`)
      context.push(`Top Performer: ${data.team.topPerformer}`)
    }
    
    // At-risk deals
    if (data.atRisk) {
      context.push(`At-Risk Revenue: $${data.atRisk.value}M (${data.atRisk.count} deals)`)
    }

    return context.join('\n')
  }

  protected generateActions(context: AgentContext, analysis: string): AgentAction[] {
    const actions: AgentAction[] = []

    // Deal acceleration
    if (analysis.toLowerCase().includes('accelerate') || analysis.toLowerCase().includes('close')) {
      actions.push({
        type: 'automation',
        title: 'Deal Acceleration Workflow',
        description: 'Trigger automated follow-ups and executive engagement for high-value deals',
        impact: 'Reduce sales cycle by 15-20%',
        requiresApproval: false,
        actionData: {
          workflow: 'deal_acceleration',
          threshold: '$100K',
          includeExecutive: true,
        }
      })
    }

    // At-risk deal alert
    if (analysis.toLowerCase().includes('risk') || analysis.toLowerCase().includes('stalled')) {
      actions.push({
        type: 'alert',
        title: 'At-Risk Deal Alert',
        description: 'Critical deals showing signs of stalling or competitive threat',
        impact: 'Potential revenue loss prevention',
        requiresApproval: false,
        actionData: {
          severity: 'high',
          dealStage: 'negotiation',
          daysSinceActivity: 7,
        }
      })
    }

    // Lead prioritization
    if (analysis.toLowerCase().includes('lead') || analysis.toLowerCase().includes('prioritize')) {
      actions.push({
        type: 'recommendation',
        title: 'AI-Powered Lead Scoring',
        description: 'Re-prioritize leads based on engagement and fit score',
        impact: 'Increase conversion rate by 25%',
        requiresApproval: true,
        actionData: {
          model: 'predictive_scoring',
          factors: ['engagement', 'fit', 'timing'],
        }
      })
    }

    // Coaching recommendation
    if (analysis.toLowerCase().includes('performance') || analysis.toLowerCase().includes('team')) {
      actions.push({
        type: 'recommendation',
        title: 'Team Coaching Focus',
        description: 'Personalized coaching recommendations for underperforming reps',
        impact: 'Improve team quota attainment by 10-15%',
        requiresApproval: false,
        actionData: {
          focus: 'objection_handling',
          reps: ['rep1', 'rep2'],
        }
      })
    }

    return actions
  }

  async processQuery(query: string, context: AgentContext): Promise<import("./base.agent").AgentResponse> {
    const analysis = `Processing query: ${query}`
    const actions = this.generateActions(context, analysis)
    return {
      content: analysis,
      actions,
      suggestions: [],
      confidence: 0.85
    }
  }
}