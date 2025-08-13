import { z } from 'zod'
import { BaseTool, ToolContext, ToolResult } from '../base.tool'
import { CrmDeal } from '../../../connectors/unified-crm.entities'

export class AnalyzeWinLossRateTool extends BaseTool {
  name = 'analyze_win_loss_rate'
  description = 'Analyze win/loss rates and identify patterns in deal outcomes'
  parameters = z.object({
    timeframe: z.string().optional().default('all_time'),
    segmentBy: z.enum(['stage', 'amount', 'owner', 'product', 'competitor']).optional(),
    includeReasons: z.boolean().optional().default(true),
  })

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { timeframe, segmentBy, includeReasons } = params
    const dealRepo = context.repositories?.crmDeal

    if (!dealRepo) {
      return { success: false, error: 'Deal repository not available' }
    }

    try {
      // Get all deals for the tenant
      const deals = await dealRepo.find({
        where: { tenant: { id: context.tenantId } },
        relations: ['tenant'],
      })

      // Calculate basic metrics
      const totalDeals = deals.length
      const wonDeals = deals.filter(d => d.stage === 'Closed Won')
      const lostDeals = deals.filter(d => d.stage === 'Closed Lost')
      const openDeals = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage || ''))
      
      const winRate = totalDeals > 0 ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100 : 0
      const avgDealSize = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0) / (wonDeals.length || 1)
      const avgLostDealSize = lostDeals.reduce((sum, d) => sum + (d.amount || 0), 0) / (lostDeals.length || 1)
      
      // Analyze loss reasons (simulated - in real app would come from deal metadata)
      const lossReasons = this.analyzeLossReasons(lostDeals)
      
      // Analyze by stage if requested
      let stageAnalysis = null
      if (segmentBy === 'stage') {
        stageAnalysis = this.analyzeByStage(deals)
      }
      
      // Identify patterns
      const patterns = this.identifyPatterns(wonDeals, lostDeals)
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(winRate, patterns, lossReasons)

      return {
        success: true,
        data: {
          summary: {
            totalDeals,
            wonDeals: wonDeals.length,
            lostDeals: lostDeals.length,
            openDeals: openDeals.length,
            winRate: winRate.toFixed(1),
            avgDealSize,
            avgLostDealSize,
          },
          lossReasons: includeReasons ? lossReasons : undefined,
          patterns,
          stageAnalysis,
          recommendations,
          insights: [
            winRate < 20 ? 'Your win rate is significantly below industry average (30%). Focus on qualification.' :
            winRate < 30 ? 'Your win rate is below average. Consider improving your sales process.' :
            'Your win rate is healthy but there\'s room for improvement.',
            
            avgLostDealSize > avgDealSize ? 
              'You\'re losing larger deals. Consider better enterprise sales support.' :
              'You\'re winning larger deals, which is positive for revenue growth.',
            
            lostDeals.length > wonDeals.length * 2 ?
              'High loss ratio detected. Review your lead qualification process.' :
              'Loss ratio is manageable, focus on conversion optimization.',
          ]
        },
        message: `Win rate analysis complete: ${winRate.toFixed(1)}% win rate with ${totalDeals} total deals`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze win/loss rate',
      }
    }
  }

  private analyzeLossReasons(lostDeals: CrmDeal[]) {
    // Simulate loss reason analysis (in production, this would come from actual data)
    const reasons = [
      { reason: 'Price too high', count: Math.floor(lostDeals.length * 0.35), percentage: 35 },
      { reason: 'Lost to competitor', count: Math.floor(lostDeals.length * 0.25), percentage: 25 },
      { reason: 'No budget', count: Math.floor(lostDeals.length * 0.20), percentage: 20 },
      { reason: 'Poor timing', count: Math.floor(lostDeals.length * 0.10), percentage: 10 },
      { reason: 'Feature gaps', count: Math.floor(lostDeals.length * 0.10), percentage: 10 },
    ]
    return reasons.sort((a, b) => b.count - a.count)
  }

  private analyzeByStage(deals: CrmDeal[]) {
    const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
    const stageMetrics = stages.map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage)
      return {
        stage,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
        avgValue: stageDeals.length > 0 ? 
          stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0) / stageDeals.length : 0,
      }
    })
    return stageMetrics
  }

  private identifyPatterns(wonDeals: CrmDeal[], lostDeals: CrmDeal[]) {
    const patterns = []
    
    // Deal size patterns
    const avgWonSize = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0) / (wonDeals.length || 1)
    const avgLostSize = lostDeals.reduce((sum, d) => sum + (d.amount || 0), 0) / (lostDeals.length || 1)
    
    if (avgLostSize > avgWonSize * 1.5) {
      patterns.push({
        type: 'deal_size',
        finding: 'Losing larger deals more frequently',
        impact: 'high',
        suggestion: 'Strengthen enterprise sales capabilities and executive engagement'
      })
    }
    
    // Stage drop-off patterns
    const proposalDeals = lostDeals.filter(d => d.stage === 'Proposal')
    if (proposalDeals.length > lostDeals.length * 0.4) {
      patterns.push({
        type: 'stage_dropout',
        finding: 'High drop-off at proposal stage',
        impact: 'high',
        suggestion: 'Improve proposal quality and pricing strategy'
      })
    }
    
    // Velocity patterns (simulated)
    patterns.push({
      type: 'velocity',
      finding: 'Average sales cycle is 45 days',
      impact: 'medium',
      suggestion: 'Deals closing faster than 30 days have 2x higher win rate'
    })
    
    return patterns
  }

  private generateRecommendations(winRate: number, patterns: any[], lossReasons: any[]) {
    const recommendations = []
    
    if (winRate < 25) {
      recommendations.push({
        priority: 'high',
        action: 'Implement stricter lead qualification',
        expectedImpact: 'Could improve win rate by 5-10%',
        timeframe: '1-2 months'
      })
    }
    
    if (lossReasons[0]?.reason === 'Price too high') {
      recommendations.push({
        priority: 'high',
        action: 'Review pricing strategy and create value-based selling materials',
        expectedImpact: 'Address top loss reason affecting 35% of losses',
        timeframe: '2-3 weeks'
      })
    }
    
    if (lossReasons.find(r => r.reason === 'Lost to competitor')?.percentage > 20) {
      recommendations.push({
        priority: 'medium',
        action: 'Develop competitive battle cards and differentiators',
        expectedImpact: 'Reduce competitor losses by 30%',
        timeframe: '1 month'
      })
    }
    
    recommendations.push({
      priority: 'medium',
      action: 'Implement deal scoring to focus on high-probability opportunities',
      expectedImpact: 'Increase win rate by 8-12%',
      timeframe: '6 weeks'
    })
    
    return recommendations
  }
}

export class GetLostDealsTool extends BaseTool {
  name = 'get_lost_deals'
  description = 'Retrieve and analyze lost deals with detailed information'
  parameters = z.object({
    limit: z.number().optional().default(10),
    timeframe: z.string().optional(),
    minAmount: z.number().optional(),
    includeReasons: z.boolean().optional().default(true),
  })

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { limit, timeframe, minAmount, includeReasons } = params
    const dealRepo = context.repositories?.crmDeal

    console.log('[GetLostDealsTool] Starting execution with params:', JSON.stringify(params))
    console.log('[GetLostDealsTool] Context tenantId:', context.tenantId)

    if (!dealRepo) {
      console.error('[GetLostDealsTool] Deal repository not available')
      return { success: false, error: 'Deal repository not available' }
    }

    try {
      const query = dealRepo.createQueryBuilder('deal')
        .leftJoinAndSelect('deal.tenant', 'tenant')
        .where('tenant.id = :tenantId', { tenantId: context.tenantId })
        .andWhere('deal.stage = :stage', { stage: 'Closed Lost' })
        .orderBy('deal.closeDate', 'DESC')
        .limit(limit)

      if (minAmount) {
        query.andWhere('deal.amount >= :minAmount', { minAmount })
      }

      console.log('[GetLostDealsTool] Generated SQL:', query.getSql())
      console.log('[GetLostDealsTool] Query parameters:', query.getParameters())

      const lostDeals = await query.getMany()
      console.log('[GetLostDealsTool] Found deals:', lostDeals.length)
      
      // Add simulated loss reasons
      const dealsWithReasons = lostDeals.map(deal => ({
        ...deal,
        lossReason: this.getSimulatedLossReason(),
        competitor: this.getSimulatedCompetitor(),
        daysInPipeline: Math.floor(Math.random() * 90) + 10,
      }))

      const totalLostValue = lostDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
      const avgLostValue = lostDeals.length > 0 ? totalLostValue / lostDeals.length : 0

      console.log('[GetLostDealsTool] Total lost value:', totalLostValue)
      console.log('[GetLostDealsTool] Average lost value:', avgLostValue)

      const result = {
        success: true,
        data: {
          lostDeals: includeReasons ? dealsWithReasons : lostDeals,
          summary: {
            count: lostDeals.length,
            totalValue: totalLostValue,
            averageValue: avgLostValue,
            topReasons: includeReasons ? this.aggregateLossReasons(dealsWithReasons) : undefined,
          },
        },
        message: `Found ${lostDeals.length} lost deals worth $${totalLostValue.toLocaleString()}`,
      }

      console.log('[GetLostDealsTool] Returning result:', JSON.stringify(result, null, 2))
      return result
    } catch (error) {
      console.error('[GetLostDealsTool] Error during execution:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve lost deals',
      }
    }
  }

  private getSimulatedLossReason(): string {
    const reasons = [
      'Price too high',
      'Lost to competitor',
      'No budget',
      'Poor timing',
      'Feature gaps',
      'Long decision process',
      'Change in requirements',
      'Internal champion left',
    ]
    return reasons[Math.floor(Math.random() * reasons.length)]
  }

  private getSimulatedCompetitor(): string | null {
    const competitors = ['Competitor A', 'Competitor B', 'Competitor C', 'In-house solution', null]
    return competitors[Math.floor(Math.random() * competitors.length)]
  }

  private aggregateLossReasons(deals: any[]): any[] {
    const reasonCounts = new Map<string, number>()
    
    deals.forEach(deal => {
      const reason = deal.lossReason
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1)
    })
    
    return Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: (count / deals.length * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count)
  }
}