import { z } from 'zod'
import { BaseTool, ToolContext, ToolResult } from '../base.tool'
import { CrmDeal } from '../../../connectors/unified-crm.entities'

export class GetTopDealsTool extends BaseTool {
  name = 'get_top_deals'
  description = 'Retrieve top/best earning deals with full details'
  parameters = z.object({
    limit: z.number().optional().default(10),
    orderBy: z.enum(['amount', 'closeDate', 'createdAt']).optional().default('amount'),
    direction: z.enum(['DESC', 'ASC']).optional().default('DESC'),
    stage: z.string().optional(),
    includeDetails: z.boolean().optional().default(true),
  })

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { limit, orderBy, direction, stage, includeDetails } = params
    const dealRepo = context.repositories?.crmDeal

    console.log('[GetTopDealsTool] Starting execution with params:', JSON.stringify(params))
    console.log('[GetTopDealsTool] Context tenantId:', context.tenantId)

    if (!dealRepo) {
      console.error('[GetTopDealsTool] Deal repository not available')
      return { success: false, error: 'Deal repository not available' }
    }

    try {
      const query = dealRepo.createQueryBuilder('deal')
        .leftJoinAndSelect('deal.tenant', 'tenant')
        .where('tenant.id = :tenantId', { tenantId: context.tenantId })

      // Add stage filter if provided
      if (stage) {
        query.andWhere('deal.stage = :stage', { stage })
      } else {
        // By default, exclude lost deals when looking for top performers
        query.andWhere('deal.stage != :excludeStage', { excludeStage: 'Closed Lost' })
      }

      // Apply ordering
      const orderField = orderBy === 'amount' ? 'deal.amount' : 
                        orderBy === 'closeDate' ? 'deal.closeDate' : 
                        'deal.createdAt'
      query.orderBy(orderField, direction as 'ASC' | 'DESC')
      query.limit(limit)

      console.log('[GetTopDealsTool] Generated SQL:', query.getSql())
      console.log('[GetTopDealsTool] Query parameters:', query.getParameters())

      const deals = await query.getMany()
      console.log('[GetTopDealsTool] Found deals:', deals.length)

      // Calculate summary statistics
      const totalValue = deals.reduce((sum, d) => sum + (d.amount || 0), 0)
      const avgValue = deals.length > 0 ? totalValue / deals.length : 0
      const maxValue = Math.max(...deals.map(d => d.amount || 0))
      const minValue = Math.min(...deals.map(d => d.amount || 0))

      // Format deals with additional context
      const formattedDeals = deals.map((deal, index) => ({
        rank: index + 1,
        id: deal.id,
        name: deal.name,
        amount: deal.amount,
        stage: deal.stage,
        closeDate: deal.closeDate,
        provider: deal.provider,
        createdAt: deal.createdAt,
        // Add percentage of total
        percentOfTotal: deal.amount ? ((deal.amount / totalValue) * 100).toFixed(1) : '0',
        // Add relative size indicator
        sizeIndicator: deal.amount >= avgValue * 1.5 ? 'Large' : 
                      deal.amount >= avgValue ? 'Above Average' : 
                      deal.amount >= avgValue * 0.5 ? 'Below Average' : 'Small'
      }))

      const result = {
        success: true,
        data: {
          deals: includeDetails ? formattedDeals : formattedDeals.map(d => ({
            rank: d.rank,
            name: d.name,
            amount: d.amount,
            stage: d.stage
          })),
          summary: {
            count: deals.length,
            totalValue,
            averageValue: avgValue,
            maxValue,
            minValue,
            topDeal: formattedDeals[0] ? {
              name: formattedDeals[0].name,
              amount: formattedDeals[0].amount,
              percentOfTotal: formattedDeals[0].percentOfTotal
            } : null
          },
          insights: this.generateInsights(formattedDeals, avgValue, totalValue)
        },
        message: `Retrieved top ${deals.length} deals worth $${totalValue.toLocaleString()}`,
      }

      console.log('[GetTopDealsTool] Returning result with', result.data.deals.length, 'deals')
      return result
    } catch (error) {
      console.error('[GetTopDealsTool] Error during execution:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve top deals',
      }
    }
  }

  private generateInsights(deals: any[], avgValue: number, totalValue: number): string[] {
    const insights: string[] = []

    if (deals.length === 0) {
      return ['No deals found matching the criteria']
    }

    // Concentration insight
    const top3Value = deals.slice(0, 3).reduce((sum, d) => sum + (d.amount || 0), 0)
    const top3Percent = (top3Value / totalValue * 100).toFixed(1)
    if (parseFloat(top3Percent) > 50) {
      insights.push(`Top 3 deals represent ${top3Percent}% of total value - high concentration risk`)
    }

    // Deal size distribution
    const largeDeals = deals.filter(d => d.sizeIndicator === 'Large').length
    const smallDeals = deals.filter(d => d.sizeIndicator === 'Small').length
    if (largeDeals > deals.length * 0.3) {
      insights.push(`${largeDeals} large deals (${(largeDeals/deals.length*100).toFixed(0)}%) - strong high-value focus`)
    }
    if (smallDeals > deals.length * 0.5) {
      insights.push(`${smallDeals} small deals (${(smallDeals/deals.length*100).toFixed(0)}%) - consider focus on larger opportunities`)
    }

    // Stage distribution
    const stageGroups = deals.reduce((acc, d) => {
      acc[d.stage] = (acc[d.stage] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const closedWon = stageGroups['Closed Won'] || 0
    const inProgress = deals.length - closedWon - (stageGroups['Closed Lost'] || 0)
    if (inProgress > deals.length * 0.6) {
      insights.push(`${inProgress} deals still in progress - strong active pipeline`)
    }

    // Value spread insight
    if (deals[0] && deals[0].amount > avgValue * 3) {
      insights.push(`Top deal is ${(deals[0].amount / avgValue).toFixed(1)}x the average - exceptional opportunity`)
    }

    return insights
  }
}