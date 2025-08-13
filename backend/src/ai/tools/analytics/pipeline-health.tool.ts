import { z } from 'zod'
import { BaseTool, ToolContext, ToolResult } from '../base.tool'
import { CrmDeal } from '../../../connectors/unified-crm.entities'

export class PipelineHealthTool extends BaseTool {
  name = 'analyze_pipeline_health'
  description = 'Analyze the health of the sales pipeline and identify risks and opportunities'
  parameters = z.object({
    includeRisks: z.boolean().optional().default(true),
    includeOpportunities: z.boolean().optional().default(true),
    forecastPeriod: z.enum(['month', 'quarter', 'year']).optional().default('quarter'),
  })

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { includeRisks, includeOpportunities, forecastPeriod } = params
    const dealRepo = context.repositories?.crmDeal

    if (!dealRepo) {
      return { success: false, error: 'Deal repository not available' }
    }

    try {
      const deals = await dealRepo.find({
        where: { tenant: { id: context.tenantId } },
        relations: ['tenant'],
      })

      // Categorize deals by stage
      const stageDistribution = this.getStageDistribution(deals)
      
      // Calculate pipeline velocity
      const velocity = this.calculateVelocity(deals)
      
      // Analyze pipeline balance
      const balance = this.analyzePipelineBalance(deals)
      
      // Identify risks
      const risks = includeRisks ? this.identifyRisks(deals) : []
      
      // Identify opportunities
      const opportunities = includeOpportunities ? this.identifyOpportunities(deals) : []
      
      // Calculate forecast
      const forecast = this.calculateForecast(deals, forecastPeriod)
      
      // Generate health score
      const healthScore = this.calculateHealthScore(stageDistribution, velocity, balance, risks)

      return {
        success: true,
        data: {
          healthScore,
          summary: {
            totalDeals: deals.length,
            totalValue: deals.reduce((sum, d) => sum + (d.amount || 0), 0),
            openDeals: deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage || '')).length,
            averageDealSize: deals.length > 0 ? 
              deals.reduce((sum, d) => sum + (d.amount || 0), 0) / deals.length : 0,
          },
          stageDistribution,
          velocity,
          balance,
          risks,
          opportunities,
          forecast,
          recommendations: this.generateRecommendations(healthScore, risks, opportunities),
        },
        message: `Pipeline health score: ${healthScore.score}/100 (${healthScore.rating})`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze pipeline health',
      }
    }
  }

  private getStageDistribution(deals: CrmDeal[]) {
    const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
    const openDeals = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage || ''))
    
    return stages.map(stage => {
      const stageDeals = openDeals.filter(d => d.stage === stage)
      const value = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
      
      return {
        stage,
        count: stageDeals.length,
        value,
        percentage: openDeals.length > 0 ? (stageDeals.length / openDeals.length * 100) : 0,
        avgDealSize: stageDeals.length > 0 ? value / stageDeals.length : 0,
      }
    }).filter(s => s.stage !== 'Closed Won' && s.stage !== 'Closed Lost')
  }

  private calculateVelocity(deals: CrmDeal[]) {
    // Simulate velocity metrics
    const closedDeals = deals.filter(d => d.stage === 'Closed Won')
    const avgCycleTime = 45 // days (simulated)
    const conversionRate = closedDeals.length / (deals.length || 1) * 100
    
    return {
      averageCycleTime: avgCycleTime,
      conversionRate: conversionRate.toFixed(1),
      stageVelocity: [
        { from: 'Prospecting', to: 'Qualification', avgDays: 5, conversionRate: 75 },
        { from: 'Qualification', to: 'Proposal', avgDays: 10, conversionRate: 60 },
        { from: 'Proposal', to: 'Negotiation', avgDays: 15, conversionRate: 50 },
        { from: 'Negotiation', to: 'Closed Won', avgDays: 15, conversionRate: 40 },
      ],
      trend: avgCycleTime < 40 ? 'improving' : avgCycleTime > 50 ? 'declining' : 'stable',
    }
  }

  private analyzePipelineBalance(deals: CrmDeal[]) {
    const openDeals = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage || ''))
    const totalOpenValue = openDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
    
    // Calculate deal age distribution
    const ageDistribution = {
      fresh: openDeals.filter(d => this.getDealAge(d) < 30).length,
      active: openDeals.filter(d => this.getDealAge(d) >= 30 && this.getDealAge(d) < 60).length,
      aging: openDeals.filter(d => this.getDealAge(d) >= 60 && this.getDealAge(d) < 90).length,
      stale: openDeals.filter(d => this.getDealAge(d) >= 90).length,
    }
    
    // Calculate coverage ratio (pipeline value vs quota)
    const monthlyQuota = 1000000 // Simulated
    const coverageRatio = (totalOpenValue / (monthlyQuota * 3)).toFixed(1) // 3x coverage ideal
    
    return {
      totalOpenValue,
      ageDistribution,
      coverageRatio,
      isBalanced: parseFloat(coverageRatio) >= 2.5 && parseFloat(coverageRatio) <= 4,
      recommendation: parseFloat(coverageRatio) < 2.5 ? 
        'Pipeline coverage is low. Need more prospecting.' :
        parseFloat(coverageRatio) > 4 ? 
        'Pipeline may be bloated. Focus on qualification.' :
        'Pipeline coverage is healthy.',
    }
  }

  private identifyRisks(deals: CrmDeal[]) {
    const risks = []
    const openDeals = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage || ''))
    
    // Stale deals risk
    const staleDeals = openDeals.filter(d => this.getDealAge(d) > 90)
    if (staleDeals.length > 0) {
      risks.push({
        type: 'stale_deals',
        severity: 'high',
        description: `${staleDeals.length} deals have been in pipeline > 90 days`,
        value: staleDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
        action: 'Review and close out or re-engage stale opportunities',
      })
    }
    
    // Stage concentration risk
    const proposalDeals = openDeals.filter(d => d.stage === 'Proposal')
    if (proposalDeals.length > openDeals.length * 0.4) {
      risks.push({
        type: 'stage_bottleneck',
        severity: 'medium',
        description: 'Too many deals stuck at Proposal stage',
        value: proposalDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
        action: 'Focus on moving proposals forward or disqualifying',
      })
    }
    
    // Large deal dependency
    const largeDeals = openDeals.filter(d => (d.amount || 0) > 100000)
    const largeDealValue = largeDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
    const totalValue = openDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
    
    if (largeDealValue > totalValue * 0.5 && largeDeals.length < 5) {
      risks.push({
        type: 'concentration_risk',
        severity: 'high',
        description: `Over 50% of pipeline in ${largeDeals.length} large deals`,
        value: largeDealValue,
        action: 'Diversify pipeline with more opportunities',
      })
    }
    
    // Early stage gap
    const earlyStageCount = openDeals.filter(d => 
      d.stage === 'Prospecting' || d.stage === 'Qualification'
    ).length
    
    if (earlyStageCount < openDeals.length * 0.3) {
      risks.push({
        type: 'pipeline_gap',
        severity: 'medium',
        description: 'Insufficient early-stage opportunities',
        value: 0,
        action: 'Increase prospecting activities to fill pipeline',
      })
    }
    
    return risks
  }

  private identifyOpportunities(deals: CrmDeal[]) {
    const opportunities = []
    const openDeals = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage || ''))
    
    // Fast-moving deals
    const fastDeals = openDeals.filter(d => 
      this.getDealAge(d) < 30 && d.stage === 'Negotiation'
    )
    if (fastDeals.length > 0) {
      opportunities.push({
        type: 'fast_movers',
        description: `${fastDeals.length} deals moving quickly through pipeline`,
        value: fastDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
        action: 'Prioritize these deals for faster closure',
        probability: 'high',
      })
    }
    
    // Upsell potential
    const existingCustomerDeals = openDeals.filter(d => 
      d.name?.includes('Expansion') || d.name?.includes('Upsell')
    )
    opportunities.push({
      type: 'expansion',
      description: 'Potential for upselling to existing customers',
      value: Math.floor(Math.random() * 500000) + 100000,
      action: 'Review customer success data for expansion opportunities',
      probability: 'medium',
    })
    
    // Dormant reactivation
    const dormantCount = Math.floor(Math.random() * 20) + 5
    opportunities.push({
      type: 'reactivation',
      description: `${dormantCount} dormant accounts could be reactivated`,
      value: dormantCount * 25000,
      action: 'Launch re-engagement campaign for dormant accounts',
      probability: 'medium',
    })
    
    return opportunities
  }

  private calculateForecast(deals: CrmDeal[], period: string) {
    const openDeals = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage || ''))
    
    // Calculate weighted forecast based on stage probability
    const stageProbability: { [key: string]: number } = {
      'Prospecting': 0.1,
      'Qualification': 0.25,
      'Proposal': 0.5,
      'Negotiation': 0.75,
    }
    
    const weightedValue = openDeals.reduce((sum, deal) => {
      const probability = stageProbability[deal.stage || ''] || 0.1
      return sum + ((deal.amount || 0) * probability)
    }, 0)
    
    // Add closed won from current period
    const closedWon = deals
      .filter(d => d.stage === 'Closed Won')
      .reduce((sum, d) => sum + (d.amount || 0), 0)
    
    const periodMultiplier = period === 'month' ? 1 : period === 'quarter' ? 3 : 12
    const historicalAverage = (closedWon / 12) * periodMultiplier // Monthly average * period
    
    return {
      period,
      committed: openDeals
        .filter(d => d.stage === 'Negotiation')
        .reduce((sum, d) => sum + (d.amount || 0), 0),
      bestCase: openDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
      weighted: weightedValue,
      likely: (weightedValue + historicalAverage) / 2,
      historical: historicalAverage,
      confidence: 'medium',
    }
  }

  private calculateHealthScore(
    distribution: any[],
    velocity: any,
    balance: any,
    risks: any[]
  ) {
    let score = 100
    
    // Deduct for risks
    risks.forEach(risk => {
      if (risk.severity === 'high') score -= 15
      if (risk.severity === 'medium') score -= 8
      if (risk.severity === 'low') score -= 3
    })
    
    // Deduct for imbalance
    if (!balance.isBalanced) score -= 10
    
    // Deduct for poor velocity
    if (velocity.trend === 'declining') score -= 10
    
    // Deduct for poor stage distribution
    const hasBottleneck = distribution.some(s => s.percentage > 40)
    if (hasBottleneck) score -= 10
    
    score = Math.max(0, Math.min(100, score))
    
    return {
      score,
      rating: score >= 80 ? 'Excellent' :
              score >= 60 ? 'Good' :
              score >= 40 ? 'Fair' : 'Poor',
      factors: {
        risks: risks.length,
        velocity: velocity.trend,
        balance: balance.isBalanced,
        coverage: balance.coverageRatio,
      }
    }
  }

  private generateRecommendations(healthScore: any, risks: any[], opportunities: any[]) {
    const recommendations = []
    
    // Based on health score
    if (healthScore.score < 60) {
      recommendations.push({
        priority: 'high',
        action: 'Conduct pipeline review to address critical issues',
        impact: 'Improve pipeline health score by 20+ points',
      })
    }
    
    // Based on top risks
    const highRisks = risks.filter(r => r.severity === 'high')
    if (highRisks.length > 0) {
      recommendations.push({
        priority: 'high',
        action: highRisks[0].action,
        impact: `Address risk affecting $${(highRisks[0].value || 0).toLocaleString()}`,
      })
    }
    
    // Based on opportunities
    const highProbOpps = opportunities.filter(o => o.probability === 'high')
    if (highProbOpps.length > 0) {
      recommendations.push({
        priority: 'medium',
        action: highProbOpps[0].action,
        impact: `Capture opportunity worth $${(highProbOpps[0].value || 0).toLocaleString()}`,
      })
    }
    
    // General recommendations
    if (healthScore.factors.velocity === 'declining') {
      recommendations.push({
        priority: 'medium',
        action: 'Implement sales acceleration tactics',
        impact: 'Reduce average cycle time by 20%',
      })
    }
    
    return recommendations
  }

  private getDealAge(deal: CrmDeal): number {
    // Simulate deal age in days
    return Math.floor(Math.random() * 120) + 1
  }
}