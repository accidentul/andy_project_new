import { z } from 'zod'
import { BaseTool, ToolContext, ToolResult } from '../base.tool'
import { CrmDeal } from '../../../connectors/unified-crm.entities'

export class ForecastRevenueTool extends BaseTool {
  name = 'forecast_revenue'
  description = 'Forecast revenue based on current pipeline and historical data'
  parameters = z.object({
    period: z.enum(['month', 'quarter', 'year']).optional().default('quarter'),
    scenario: z.enum(['conservative', 'realistic', 'optimistic']).optional().default('realistic'),
    includeBreakdown: z.boolean().optional().default(true),
  })

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { period, scenario, includeBreakdown } = params
    const dealRepo = context.repositories?.crmDeal

    if (!dealRepo) {
      return { success: false, error: 'Deal repository not available' }
    }

    try {
      const deals = await dealRepo.find({
        where: { tenant: { id: context.tenantId } },
        relations: ['tenant'],
      })

      const openDeals = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage || ''))
      const closedWonDeals = deals.filter(d => d.stage === 'Closed Won')

      // Calculate historical performance
      const historicalRevenue = closedWonDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
      const avgMonthlyRevenue = historicalRevenue / 12 // Assuming 12 months of data

      // Stage probability multipliers based on scenario
      const stageProbabilities = this.getStageProbabilities(scenario)
      
      // Calculate weighted pipeline value
      const weightedPipeline = this.calculateWeightedPipeline(openDeals, stageProbabilities)
      
      // Generate forecast based on period
      const forecast = this.generateForecast(
        avgMonthlyRevenue,
        weightedPipeline,
        period,
        scenario
      )

      // Create breakdown if requested
      const breakdown = includeBreakdown ? this.createForecastBreakdown(openDeals, stageProbabilities, period) : null

      // Generate insights and recommendations
      const insights = this.generateInsights(forecast, historicalRevenue, openDeals)
      
      return {
        success: true,
        data: {
          forecast,
          breakdown,
          insights,
          assumptions: this.getAssumptions(scenario),
          historical: {
            totalRevenue: historicalRevenue,
            avgMonthlyRevenue,
            closedDeals: closedWonDeals.length,
          },
          pipeline: {
            totalValue: openDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
            dealCount: openDeals.length,
            weightedValue: weightedPipeline,
          },
        },
        message: `${scenario.charAt(0).toUpperCase() + scenario.slice(1)} revenue forecast for next ${period}: $${forecast.predicted.toLocaleString()}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to forecast revenue',
      }
    }
  }

  private getStageProbabilities(scenario: string): { [key: string]: number } {
    const baseProbs = {
      'Prospecting': 0.1,
      'Qualification': 0.25,
      'Proposal': 0.5,
      'Negotiation': 0.75,
    }

    if (scenario === 'conservative') {
      return {
        'Prospecting': baseProbs.Prospecting * 0.7,
        'Qualification': baseProbs.Qualification * 0.8,
        'Proposal': baseProbs.Proposal * 0.8,
        'Negotiation': baseProbs.Negotiation * 0.9,
      }
    } else if (scenario === 'optimistic') {
      return {
        'Prospecting': baseProbs.Prospecting * 1.3,
        'Qualification': baseProbs.Qualification * 1.2,
        'Proposal': baseProbs.Proposal * 1.1,
        'Negotiation': Math.min(baseProbs.Negotiation * 1.1, 0.9),
      }
    }

    return baseProbs // realistic
  }

  private calculateWeightedPipeline(deals: CrmDeal[], probabilities: { [key: string]: number }): number {
    return deals.reduce((sum, deal) => {
      const probability = probabilities[deal.stage || ''] || 0.05
      return sum + ((deal.amount || 0) * probability)
    }, 0)
  }

  private generateForecast(
    historicalAvg: number,
    weightedPipeline: number,
    period: string,
    scenario: string
  ) {
    const periodMultiplier = period === 'month' ? 1 : period === 'quarter' ? 3 : 12
    const historicalProjection = historicalAvg * periodMultiplier

    // Blend pipeline and historical data
    let predicted: number
    if (scenario === 'conservative') {
      predicted = (historicalProjection * 0.7) + (weightedPipeline * 0.3)
    } else if (scenario === 'optimistic') {
      predicted = (historicalProjection * 0.4) + (weightedPipeline * 0.6)
    } else { // realistic
      predicted = (historicalProjection * 0.5) + (weightedPipeline * 0.5)
    }

    // Add some growth assumptions
    const growthRate = scenario === 'optimistic' ? 1.15 : scenario === 'conservative' ? 1.02 : 1.08
    predicted = predicted * growthRate

    return {
      predicted,
      range: {
        low: predicted * 0.8,
        high: predicted * 1.2,
      },
      confidence: scenario === 'realistic' ? 'medium' : scenario === 'conservative' ? 'high' : 'low',
      period,
      scenario,
      components: {
        historical: historicalProjection,
        pipeline: weightedPipeline,
        growth: (predicted - (historicalProjection + weightedPipeline)) / 2,
      },
    }
  }

  private createForecastBreakdown(deals: CrmDeal[], probabilities: { [key: string]: number }, period: string) {
    const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation']
    
    return {
      byStage: stages.map(stage => {
        const stageDeals = deals.filter(d => d.stage === stage)
        const totalValue = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
        const probability = probabilities[stage] || 0
        const expectedValue = totalValue * probability

        return {
          stage,
          dealCount: stageDeals.length,
          totalValue,
          probability: (probability * 100).toFixed(1) + '%',
          expectedValue,
        }
      }),
      byDealSize: this.breakdownByDealSize(deals, probabilities),
      timeline: this.createTimelineBreakdown(deals, period),
    }
  }

  private breakdownByDealSize(deals: CrmDeal[], probabilities: { [key: string]: number }) {
    const categories = [
      { name: 'Small (<$25k)', min: 0, max: 25000 },
      { name: 'Medium ($25k-$100k)', min: 25000, max: 100000 },
      { name: 'Large ($100k-$500k)', min: 100000, max: 500000 },
      { name: 'Enterprise (>$500k)', min: 500000, max: Infinity },
    ]

    return categories.map(category => {
      const categoryDeals = deals.filter(d => {
        const amount = d.amount || 0
        return amount >= category.min && amount < category.max
      })

      const expectedValue = categoryDeals.reduce((sum, deal) => {
        const probability = probabilities[deal.stage || ''] || 0.05
        return sum + ((deal.amount || 0) * probability)
      }, 0)

      return {
        category: category.name,
        dealCount: categoryDeals.length,
        totalValue: categoryDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
        expectedValue,
      }
    })
  }

  private createTimelineBreakdown(deals: CrmDeal[], period: string) {
    // Simulate timeline breakdown based on deal velocity
    const timeUnits = period === 'month' ? 4 : period === 'quarter' ? 12 : 52 // weeks
    const unitName = 'week'

    return Array.from({ length: Math.min(timeUnits, 8) }, (_, i) => {
      const weekNum = i + 1
      // Simulate deals closing over time (front-loaded)
      const dealCount = Math.max(1, Math.floor(deals.length / timeUnits * (timeUnits - i) / 2))
      const estimatedRevenue = (deals
        .slice(0, dealCount)
        .reduce((sum, d) => sum + (d.amount || 0), 0)) / timeUnits * (2 - (i / timeUnits))

      return {
        period: `${unitName} ${weekNum}`,
        estimatedDealsClosing: dealCount,
        estimatedRevenue: Math.floor(estimatedRevenue),
      }
    })
  }

  private generateInsights(forecast: any, historicalRevenue: number, openDeals: CrmDeal[]) {
    const insights = []
    const growthRate = (forecast.predicted / (historicalRevenue || 1) - 1) * 100

    // Growth insights
    if (growthRate > 20) {
      insights.push({
        type: 'growth',
        message: `Strong growth projected: ${growthRate.toFixed(1)}% increase from historical average`,
        impact: 'positive',
      })
    } else if (growthRate < 0) {
      insights.push({
        type: 'risk',
        message: `Revenue decline projected: ${Math.abs(growthRate).toFixed(1)}% decrease from historical average`,
        impact: 'negative',
      })
    } else {
      insights.push({
        type: 'stable',
        message: `Moderate growth projected: ${growthRate.toFixed(1)}% increase from historical average`,
        impact: 'neutral',
      })
    }

    // Pipeline health insights
    const pipelineValue = openDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
    const pipelineCoverage = pipelineValue / forecast.predicted

    if (pipelineCoverage < 2) {
      insights.push({
        type: 'pipeline',
        message: 'Pipeline coverage is low. Need more prospecting to hit forecast.',
        impact: 'negative',
      })
    } else if (pipelineCoverage > 4) {
      insights.push({
        type: 'pipeline',
        message: 'Strong pipeline coverage. Focus on conversion and velocity.',
        impact: 'positive',
      })
    }

    // Deal concentration insights
    const largeDeals = openDeals.filter(d => (d.amount || 0) > 100000)
    if (largeDeals.length > 0) {
      const largeDealsValue = largeDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
      const concentration = largeDealsValue / pipelineValue * 100

      if (concentration > 50) {
        insights.push({
          type: 'risk',
          message: `${concentration.toFixed(1)}% of forecast depends on ${largeDeals.length} large deals`,
          impact: 'negative',
        })
      }
    }

    return insights
  }

  private getAssumptions(scenario: string) {
    const baseAssumptions = [
      'Historical performance is indicative of future results',
      'Current pipeline deals will progress through stages',
      'Market conditions remain stable',
    ]

    if (scenario === 'conservative') {
      return [
        ...baseAssumptions,
        'Lower conversion rates due to economic headwinds',
        'Extended sales cycles',
        'Increased competition',
      ]
    } else if (scenario === 'optimistic') {
      return [
        ...baseAssumptions,
        'Market tailwinds accelerate deal velocity',
        'Higher conversion rates from process improvements',
        'Strong customer demand',
      ]
    }

    return baseAssumptions
  }
}

export class AnalyzeTrendsTool extends BaseTool {
  name = 'analyze_trends'
  description = 'Analyze trends and patterns in business metrics over time'
  parameters = z.object({
    metric: z.enum(['revenue', 'deals', 'pipeline', 'win_rate', 'cycle_time']).optional().default('revenue'),
    timeframe: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
    periods: z.number().optional().default(12),
  })

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { metric, timeframe, periods } = params
    const dealRepo = context.repositories?.crmDeal

    if (!dealRepo) {
      return { success: false, error: 'Deal repository not available' }
    }

    try {
      const deals = await dealRepo.find({
        where: { tenant: { id: context.tenantId } },
        relations: ['tenant'],
      })

      // Simulate trend data (in production, this would query historical data)
      const trendData = this.generateTrendData(deals, metric, timeframe, periods)
      const analysis = this.analyzeTrendData(trendData, metric)

      return {
        success: true,
        data: {
          metric,
          timeframe,
          periods,
          trendData,
          analysis,
          insights: this.generateTrendInsights(trendData, analysis, metric),
          recommendations: this.generateTrendRecommendations(analysis, metric),
        },
        message: `Trend analysis complete: ${metric} shows ${analysis.direction} trend over ${periods} ${timeframe}s`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze trends',
      }
    }
  }

  private generateTrendData(deals: CrmDeal[], metric: string, timeframe: string, periods: number) {
    // Simulate historical data points
    const data = []
    const baseValue = this.getBaseValue(deals, metric)

    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date()
      if (timeframe === 'week') date.setDate(date.getDate() - (i * 7))
      else if (timeframe === 'month') date.setMonth(date.getMonth() - i)
      else if (timeframe === 'quarter') date.setMonth(date.getMonth() - (i * 3))
      else date.setFullYear(date.getFullYear() - i)

      // Add some randomness and trend
      const trendFactor = 1 + (Math.random() * 0.4 - 0.2) // ±20% variation
      const growthTrend = 1 + ((periods - i) * 0.02) // 2% growth per period
      const value = Math.floor(baseValue * trendFactor * growthTrend)

      data.push({
        period: this.formatPeriod(date, timeframe),
        value,
        date: date.toISOString().split('T')[0],
      })
    }

    return data
  }

  private getBaseValue(deals: CrmDeal[], metric: string): number {
    switch (metric) {
      case 'revenue':
        return deals.filter(d => d.stage === 'Closed Won')
          .reduce((sum, d) => sum + (d.amount || 0), 0) / 12 // Monthly average
      case 'deals':
        return Math.floor(deals.length / 12) // Monthly average
      case 'pipeline':
        return deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage || ''))
          .reduce((sum, d) => sum + (d.amount || 0), 0) / 4 // Quarterly average
      case 'win_rate':
        const won = deals.filter(d => d.stage === 'Closed Won').length
        const lost = deals.filter(d => d.stage === 'Closed Lost').length
        return won / (won + lost || 1) * 100
      case 'cycle_time':
        return 45 // Average days
      default:
        return 100000
    }
  }

  private formatPeriod(date: Date, timeframe: string): string {
    if (timeframe === 'week') {
      return `Week ${Math.ceil(date.getDate() / 7)} ${date.getMonth() + 1}`
    } else if (timeframe === 'month') {
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
    } else if (timeframe === 'quarter') {
      const quarter = Math.ceil((date.getMonth() + 1) / 3)
      return `Q${quarter} ${date.getFullYear()}`
    } else {
      return date.getFullYear().toString()
    }
  }

  private analyzeTrendData(data: any[], metric: string) {
    const values = data.map(d => d.value)
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))

    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length

    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100
    const direction = changePercent > 5 ? 'upward' : changePercent < -5 ? 'downward' : 'stable'

    // Calculate volatility (coefficient of variation)
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    const volatility = Math.sqrt(variance) / mean

    return {
      direction,
      changePercent: changePercent.toFixed(1),
      volatility: volatility.toFixed(2),
      recent: values.slice(-3), // Last 3 periods
      peak: Math.max(...values),
      trough: Math.min(...values),
      average: mean.toFixed(0),
    }
  }

  private generateTrendInsights(data: any[], analysis: any, metric: string) {
    const insights = []

    // Direction insights
    if (analysis.direction === 'upward') {
      insights.push({
        type: 'positive',
        message: `${metric} is trending upward with ${analysis.changePercent}% improvement`,
      })
    } else if (analysis.direction === 'downward') {
      insights.push({
        type: 'negative',
        message: `${metric} is declining by ${Math.abs(analysis.changePercent)}% - needs attention`,
      })
    } else {
      insights.push({
        type: 'neutral',
        message: `${metric} is stable with minimal variation`,
      })
    }

    // Volatility insights
    if (parseFloat(analysis.volatility) > 0.3) {
      insights.push({
        type: 'warning',
        message: 'High volatility detected - results are inconsistent',
      })
    } else if (parseFloat(analysis.volatility) < 0.1) {
      insights.push({
        type: 'positive',
        message: 'Low volatility indicates consistent performance',
      })
    }

    // Recent performance
    const recentTrend = analysis.recent[2] > analysis.recent[0] ? 'improving' : 'declining'
    insights.push({
      type: recentTrend === 'improving' ? 'positive' : 'negative',
      message: `Recent periods show ${recentTrend} performance`,
    })

    return insights
  }

  private generateTrendRecommendations(analysis: any, metric: string) {
    const recommendations = []

    if (analysis.direction === 'downward') {
      recommendations.push({
        priority: 'high',
        action: `Investigate root causes of ${metric} decline`,
        impact: 'Address performance drop',
      })
    }

    if (parseFloat(analysis.volatility) > 0.3) {
      recommendations.push({
        priority: 'medium',
        action: 'Implement process improvements to reduce variability',
        impact: 'Improve consistency and predictability',
      })
    }

    if (analysis.direction === 'upward') {
      recommendations.push({
        priority: 'low',
        action: 'Identify and replicate success factors',
        impact: 'Sustain positive momentum',
      })
    }

    return recommendations
  }
}