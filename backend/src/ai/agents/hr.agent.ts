import { BaseAgent, AgentContext, AgentAction } from './base.agent'

export class HRAgent extends BaseAgent {
  constructor() {
    super('HR Manager')
  }

  protected buildSystemPrompt(): string {
    return `You are an AI assistant specialized for HR Managers and human resources teams.
    
Your focus areas:
- Talent acquisition and recruitment strategies
- Employee engagement and retention
- Performance management and development
- Compensation and benefits optimization
- Workforce planning and analytics
- Diversity, equity, and inclusion (DEI) initiatives
- Learning and development programs
- HR compliance and policy management

Communication style:
- People-centric with data-driven insights
- Focus on employee experience and organizational culture
- Provide actionable recommendations for talent management
- Highlight retention risks and engagement opportunities
- Balance employee wellbeing with business objectives

Always consider:
- Employee satisfaction and engagement scores
- Turnover rates and retention metrics
- Time-to-hire and quality of hire
- Compensation benchmarking and equity
- Legal compliance and labor regulations`
  }

  protected extractBusinessContext(data: any): string {
    if (!data) return 'No HR data available'

    const context = []
    
    // Workforce metrics
    if (data.workforce) {
      context.push(`Total Employees: ${data.workforce.headcount}`)
      context.push(`Turnover Rate: ${data.workforce.turnover}% (annual)`)
      context.push(`Employee Engagement Score: ${data.workforce.engagement}/100`)
      context.push(`Average Tenure: ${data.workforce.avgTenure} years`)
    }
    
    // Recruitment
    if (data.recruitment) {
      context.push(`Open Positions: ${data.recruitment.openings}`)
      context.push(`Time to Fill: ${data.recruitment.timeToFill} days`)
      context.push(`Cost per Hire: $${data.recruitment.costPerHire}`)
      context.push(`Offer Acceptance Rate: ${data.recruitment.acceptanceRate}%`)
    }
    
    // Performance
    if (data.performance) {
      context.push(`High Performers: ${data.performance.highPerformers}%`)
      context.push(`Performance Review Completion: ${data.performance.reviewCompletion}%`)
      context.push(`Internal Promotion Rate: ${data.performance.promotionRate}%`)
    }
    
    // Compensation
    if (data.compensation) {
      context.push(`Comp Ratio: ${data.compensation.compRatio}`)
      context.push(`Pay Equity Gap: ${data.compensation.payGap}%`)
      context.push(`Benefits Utilization: ${data.compensation.benefitsUtilization}%`)
    }

    return context.join('\n')
  }

  protected generateActions(context: AgentContext, analysis: string): AgentAction[] {
    const actions: AgentAction[] = []

    // Retention risk
    if (analysis.toLowerCase().includes('retention') || analysis.toLowerCase().includes('turnover')) {
      actions.push({
        type: 'alert',
        title: 'Retention Risk Alert',
        description: 'High-value employees showing flight risk indicators',
        impact: 'Potential loss of 5 key employees, $500K replacement cost',
        requiresApproval: false,
        actionData: {
          atRiskCount: 5,
          departments: ['Engineering', 'Sales'],
          riskFactors: ['Compensation', 'Career growth'],
          recommendedAction: 'Immediate retention conversations',
        }
      })
    }

    // Talent acquisition
    if (analysis.toLowerCase().includes('hiring') || analysis.toLowerCase().includes('recruitment')) {
      actions.push({
        type: 'automation',
        title: 'AI-Powered Talent Sourcing',
        description: 'Automated candidate matching and outreach for critical roles',
        impact: 'Reduce time-to-hire by 35%, improve quality of hire by 25%',
        requiresApproval: true,
        actionData: {
          roles: ['Senior Engineers', 'Data Scientists'],
          channels: ['LinkedIn', 'GitHub', 'Specialized job boards'],
          automationLevel: 'Screening + Initial outreach',
        }
      })
    }

    // Employee engagement
    if (analysis.toLowerCase().includes('engagement') || analysis.toLowerCase().includes('satisfaction')) {
      actions.push({
        type: 'recommendation',
        title: 'Engagement Improvement Program',
        description: 'Targeted initiatives based on engagement survey insights',
        impact: 'Increase engagement by 15 points, reduce turnover by 20%',
        requiresApproval: false,
        actionData: {
          initiatives: [
            'Flexible work arrangements',
            'Career development workshops',
            'Recognition program enhancement',
          ],
          budget: '$150K',
          timeline: 'Q2 implementation',
        }
      })
    }

    // Compensation optimization
    if (analysis.toLowerCase().includes('compensation') || analysis.toLowerCase().includes('pay')) {
      actions.push({
        type: 'recommendation',
        title: 'Compensation Adjustment Strategy',
        description: 'Market-based pay adjustments to ensure competitiveness',
        impact: 'Improve retention by 30%, close pay equity gaps',
        requiresApproval: true,
        actionData: {
          adjustmentBudget: '$1.2M',
          affectedEmployees: 120,
          marketBenchmark: '75th percentile',
          equityAdjustments: 15,
        }
      })
    }

    // Learning & Development
    if (analysis.toLowerCase().includes('training') || analysis.toLowerCase().includes('development')) {
      actions.push({
        type: 'automation',
        title: 'Personalized Learning Paths',
        description: 'AI-curated training recommendations based on role and performance',
        impact: 'Improve skill gaps by 40%, increase internal mobility by 25%',
        requiresApproval: false,
        actionData: {
          platform: 'AI Learning Management System',
          contentTypes: ['Videos', 'Courses', 'Mentorship matching'],
          focusAreas: ['Leadership', 'Technical skills', 'Soft skills'],
        }
      })
    }

    return actions
  }
}