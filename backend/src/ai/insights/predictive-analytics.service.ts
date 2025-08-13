import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CrmDeal, CrmAccount, CrmActivity } from '../../connectors/unified-crm.entities'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

export interface Forecast {
  id: string
  type: 'revenue' | 'deals' | 'conversion' | 'activity' | 'custom'
  metric: string
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  predictions: {
    date: Date
    value: number
    confidence: number
    upperBound: number
    lowerBound: number
  }[]
  accuracy: number
  factors: {
    name: string
    impact: number
    description: string
  }[]
  recommendations: string[]
  generatedAt: Date
  tenantId: string
}

export interface TrendAnalysis {
  metric: string
  direction: 'up' | 'down' | 'stable'
  strength: number // 0-1
  consistency: number // 0-1
  seasonality?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    peakPeriods: string[]
    lowPeriods: string[]
  }
  outliers: {
    date: Date
    value: number
    deviation: number
  }[]
}

const ForecastSchema = z.object({
  predictions: z.array(z.object({
    period: z.string(),
    value: z.number(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string()
  })),
  keyFactors: z.array(z.object({
    factor: z.string(),
    impact: z.enum(['positive', 'negative', 'neutral']),
    weight: z.number().min(0).max(1)
  })),
  recommendations: z.array(z.string()),
  accuracy: z.number().min(0).max(1)
})

@Injectable()
export class PredictiveAnalyticsService {
  private readonly logger = new Logger(PredictiveAnalyticsService.name)

  constructor(
    @InjectRepository(CrmDeal) private dealRepo: Repository<CrmDeal>,
    @InjectRepository(CrmAccount) private accountRepo: Repository<CrmAccount>,
    @InjectRepository(CrmActivity) private activityRepo: Repository<CrmActivity>,
  ) {}

  async generateRevenueForecast(
    tenantId: string,
    period: Forecast['period'] = 'monthly',
    horizonDays = 90
  ): Promise<Forecast> {
    this.logger.log(`Generating ${period} revenue forecast for ${horizonDays} days`)
    
    // Get historical data
    const historicalData = await this.getHistoricalRevenue(tenantId, period)
    
    // Analyze trends
    const trendAnalysis = this.analyzeTrend(historicalData)
    
    // Get contextual factors
    const contextFactors = await this.getContextualFactors(tenantId)
    
    // Generate AI-powered forecast
    const aiForecast = await this.generateAIForecast(
      historicalData,
      trendAnalysis,
      contextFactors,
      horizonDays,
      period
    )
    
    // Calculate confidence intervals
    const predictions = this.calculatePredictions(
      aiForecast,
      trendAnalysis,
      period,
      horizonDays
    )
    
    return {
      id: `forecast-revenue-${Date.now()}`,
      type: 'revenue',
      metric: 'Total Revenue',
      period,
      predictions,
      accuracy: aiForecast.accuracy,
      factors: this.mapFactors(aiForecast.keyFactors),
      recommendations: aiForecast.recommendations,
      generatedAt: new Date(),
      tenantId
    }
  }

  async generateDealForecast(
    tenantId: string,
    period: Forecast['period'] = 'weekly'
  ): Promise<Forecast> {
    // Get deal closure patterns
    const closurePatterns = await this.dealRepo
      .createQueryBuilder('deal')
      .select(`
        DATE(deal.closeDate) as date,
        COUNT(*) as count,
        SUM(CASE WHEN deal.stage = 'Closed Won' THEN 1 ELSE 0 END) as won,
        AVG(deal.amount) as avg_amount
      `)
      .where('deal.tenantId = :tenantId', { tenantId })
      .andWhere("deal.closeDate >= date('now', '-90 days')")
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany()
    
    // Analyze win rate trends
    const winRates = closurePatterns.map(p => ({
      date: new Date(p.date),
      rate: Number(p.won) / Number(p.count),
      volume: Number(p.count)
    }))
    
    // Get pipeline velocity
    const velocity = await this.calculatePipelineVelocity(tenantId)
    
    // Generate predictions
    const predictions = this.forecastDeals(winRates, velocity, period)
    
    return {
      id: `forecast-deals-${Date.now()}`,
      type: 'deals',
      metric: 'Deal Closures',
      period,
      predictions,
      accuracy: 0.75,
      factors: [
        {
          name: 'Historical Win Rate',
          impact: 0.4,
          description: `Average win rate: ${(winRates.reduce((sum, w) => sum + w.rate, 0) / winRates.length * 100).toFixed(1)}%`
        },
        {
          name: 'Pipeline Velocity',
          impact: 0.3,
          description: `Average days to close: ${velocity.avgDaysToClose.toFixed(0)}`
        },
        {
          name: 'Seasonality',
          impact: 0.2,
          description: 'Historical patterns show quarterly variations'
        }
      ],
      recommendations: this.generateDealRecommendations(winRates, velocity),
      generatedAt: new Date(),
      tenantId
    }
  }

  async forecastConversionRate(tenantId: string): Promise<TrendAnalysis> {
    // Get stage transition data
    const transitions = await this.dealRepo
      .createQueryBuilder('deal')
      .select(`
        deal.stage,
        COUNT(*) as count,
        AVG(JULIANDAY(deal.updatedAt) - JULIANDAY(deal.createdAt)) as avg_days
      `)
      .where('deal.tenantId = :tenantId', { tenantId })
      .groupBy('deal.stage')
      .getRawMany()
    
    // Calculate conversion funnel
    const funnel = this.calculateConversionFunnel(transitions)
    
    // Detect patterns
    const seasonality = await this.detectSeasonality(tenantId)
    
    return {
      metric: 'Conversion Rate',
      direction: funnel.trend,
      strength: funnel.strength,
      consistency: funnel.consistency,
      seasonality,
      outliers: []
    }
  }

  private async getHistoricalRevenue(
    tenantId: string,
    period: Forecast['period']
  ): Promise<{ date: Date; value: number }[]> {
    let dateFormat: string
    let daysBack: number
    
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d'
        daysBack = 90
        break
      case 'weekly':
        dateFormat = '%Y-W%W'
        daysBack = 180
        break
      case 'monthly':
        dateFormat = '%Y-%m'
        daysBack = 365
        break
      case 'quarterly':
        dateFormat = '%Y-Q'
        daysBack = 365 * 2
        break
      default:
        dateFormat = '%Y-%m'
        daysBack = 365
    }
    
    const revenue = await this.dealRepo
      .createQueryBuilder('deal')
      .select(`
        strftime('${dateFormat}', deal.closeDate) as period,
        SUM(deal.amount) as revenue
      `)
      .where('deal.tenantId = :tenantId', { tenantId })
      .andWhere('deal.stage = :stage', { stage: 'Closed Won' })
      .andWhere(`deal.closeDate >= date('now', '-${daysBack} days')`)
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany()
    
    return revenue.map(r => ({
      date: new Date(r.period),
      value: Number(r.revenue)
    }))
  }

  private analyzeTrend(
    data: { date: Date; value: number }[]
  ): TrendAnalysis {
    if (data.length < 3) {
      return {
        metric: 'Revenue',
        direction: 'stable',
        strength: 0,
        consistency: 0,
        outliers: []
      }
    }
    
    // Calculate moving averages
    const ma7 = this.calculateMovingAverage(data, 7)
    const ma30 = this.calculateMovingAverage(data, 30)
    
    // Determine trend direction
    const recentTrend = ma7.slice(-3)
    const longerTrend = ma30.slice(-3)
    
    const recentSlope = this.calculateSlope(recentTrend)
    const longerSlope = this.calculateSlope(longerTrend)
    
    let direction: 'up' | 'down' | 'stable'
    if (recentSlope > 0.05 && longerSlope > 0.02) direction = 'up'
    else if (recentSlope < -0.05 && longerSlope < -0.02) direction = 'down'
    else direction = 'stable'
    
    // Calculate strength (0-1)
    const strength = Math.min(Math.abs(recentSlope) / 0.2, 1)
    
    // Calculate consistency (0-1)
    const variance = this.calculateVariance(data.map(d => d.value))
    const mean = data.reduce((sum, d) => sum + d.value, 0) / data.length
    const consistency = Math.max(1 - (variance / mean), 0)
    
    // Detect outliers
    const outliers = this.detectOutliers(data)
    
    return {
      metric: 'Revenue',
      direction,
      strength,
      consistency,
      outliers
    }
  }

  private async getContextualFactors(tenantId: string) {
    const [
      openDeals,
      recentActivities,
      teamSize
    ] = await Promise.all([
      this.dealRepo.count({
        where: {
          tenant: { id: tenantId },
          stage: 'Negotiation'
        }
      }),
      this.activityRepo.count({
        where: {
          tenant: { id: tenantId }
        }
      }),
      this.dealRepo
        .createQueryBuilder('deal')
        .select('COUNT(DISTINCT deal.ownerId) as count')
        .where('deal.tenantId = :tenantId', { tenantId })
        .getRawOne()
    ])
    
    return {
      pipelineStrength: openDeals,
      activityLevel: recentActivities,
      teamCapacity: Number(teamSize?.count || 1)
    }
  }

  private async generateAIForecast(
    historicalData: { date: Date; value: number }[],
    trendAnalysis: TrendAnalysis,
    contextFactors: any,
    horizonDays: number,
    period: Forecast['period']
  ) {
    const prompt = `
    Analyze this historical revenue data and generate a forecast:
    
    Historical Data (last 10 periods):
    ${historicalData.slice(-10).map(d => `${d.date.toISOString().split('T')[0]}: $${d.value.toLocaleString()}`).join('\n')}
    
    Trend Analysis:
    - Direction: ${trendAnalysis.direction}
    - Strength: ${(trendAnalysis.strength * 100).toFixed(0)}%
    - Consistency: ${(trendAnalysis.consistency * 100).toFixed(0)}%
    
    Context:
    - Open deals in negotiation: ${contextFactors.pipelineStrength}
    - Recent activity level: ${contextFactors.activityLevel}
    - Team capacity: ${contextFactors.teamCapacity}
    
    Generate a ${horizonDays}-day forecast with ${period} predictions.
    Consider seasonality, current pipeline, and market conditions.
    Provide confidence levels and key factors affecting the forecast.
    `
    
    try {
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: ForecastSchema,
        prompt,
        temperature: 0.3
      })
      
      return result.object
    } catch (error) {
      this.logger.error('AI forecast generation failed:', error)
      
      // Fallback to simple linear projection
      return this.generateSimpleForecast(historicalData, trendAnalysis, horizonDays)
    }
  }

  private calculatePredictions(
    aiForecast: any,
    trendAnalysis: TrendAnalysis,
    period: Forecast['period'],
    horizonDays: number
  ): Forecast['predictions'] {
    const predictions: Forecast['predictions'] = []
    const periodDays = this.getPeriodDays(period)
    const numPeriods = Math.ceil(horizonDays / periodDays)
    
    for (let i = 0; i < numPeriods; i++) {
      const date = new Date()
      date.setDate(date.getDate() + (i * periodDays))
      
      const aIPrediction = aiForecast.predictions[i]
      const baseValue = aIPrediction?.value || 0
      const confidence = aIPrediction?.confidence || 0.5
      
      // Calculate bounds based on confidence
      const variance = baseValue * (1 - confidence) * 0.2
      
      predictions.push({
        date,
        value: baseValue,
        confidence,
        upperBound: baseValue + variance,
        lowerBound: Math.max(0, baseValue - variance)
      })
    }
    
    return predictions
  }

  private async calculatePipelineVelocity(tenantId: string) {
    const velocity = await this.dealRepo
      .createQueryBuilder('deal')
      .select(`
        AVG(JULIANDAY(deal.closeDate) - JULIANDAY(deal.createdAt)) as avg_days,
        COUNT(*) as total_deals
      `)
      .where('deal.tenantId = :tenantId', { tenantId })
      .andWhere('deal.stage = :stage', { stage: 'Closed Won' })
      .andWhere("deal.closeDate >= date('now', '-90 days')")
      .getRawOne()
    
    return {
      avgDaysToClose: Number(velocity?.avg_days || 30),
      totalDeals: Number(velocity?.total_deals || 0)
    }
  }

  private forecastDeals(
    winRates: { date: Date; rate: number; volume: number }[],
    velocity: { avgDaysToClose: number; totalDeals: number },
    period: Forecast['period']
  ): Forecast['predictions'] {
    const avgWinRate = winRates.reduce((sum, w) => sum + w.rate, 0) / winRates.length
    const avgVolume = winRates.reduce((sum, w) => sum + w.volume, 0) / winRates.length
    
    const predictions: Forecast['predictions'] = []
    const periodDays = this.getPeriodDays(period)
    
    for (let i = 1; i <= 12; i++) {
      const date = new Date()
      date.setDate(date.getDate() + (i * periodDays))
      
      // Simple linear projection with seasonal adjustment
      const seasonalFactor = this.getSeasonalFactor(date)
      const predictedVolume = avgVolume * seasonalFactor
      const predictedWins = predictedVolume * avgWinRate
      
      predictions.push({
        date,
        value: Math.round(predictedWins),
        confidence: 0.7,
        upperBound: Math.round(predictedWins * 1.2),
        lowerBound: Math.round(predictedWins * 0.8)
      })
    }
    
    return predictions
  }

  private calculateConversionFunnel(transitions: any[]) {
    const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won']
    const funnel = stages.map(stage => {
      const stageData = transitions.find(t => t.stage === stage)
      return {
        stage,
        count: Number(stageData?.count || 0),
        avgDays: Number(stageData?.avg_days || 0)
      }
    })
    
    // Calculate conversion rates between stages
    const conversions = []
    for (let i = 1; i < funnel.length; i++) {
      if (funnel[i - 1].count > 0) {
        conversions.push(funnel[i].count / funnel[i - 1].count)
      }
    }
    
    const avgConversion = conversions.reduce((sum, c) => sum + c, 0) / conversions.length
    const trend = conversions[conversions.length - 1] > avgConversion ? 'up' : 'down'
    
    return {
      trend: trend as 'up' | 'down',
      strength: Math.abs(conversions[conversions.length - 1] - avgConversion),
      consistency: 1 - this.calculateVariance(conversions)
    }
  }

  private async detectSeasonality(tenantId: string) {
    const yearData = await this.dealRepo
      .createQueryBuilder('deal')
      .select(`
        strftime('%m', deal.closeDate) as month,
        strftime('%w', deal.closeDate) as day_of_week,
        COUNT(*) as count,
        SUM(deal.amount) as revenue
      `)
      .where('deal.tenantId = :tenantId', { tenantId })
      .andWhere('deal.stage = :stage', { stage: 'Closed Won' })
      .groupBy('month, day_of_week')
      .getRawMany()
    
    // Analyze monthly patterns
    const monthlyPattern = this.analyzeMonthlyPattern(yearData)
    
    // Analyze weekly patterns
    const weeklyPattern = this.analyzeWeeklyPattern(yearData)
    
    if (monthlyPattern.variance > 0.2) {
      return {
        pattern: 'monthly' as const,
        peakPeriods: monthlyPattern.peaks,
        lowPeriods: monthlyPattern.lows
      }
    } else if (weeklyPattern.variance > 0.1) {
      return {
        pattern: 'weekly' as const,
        peakPeriods: weeklyPattern.peaks,
        lowPeriods: weeklyPattern.lows
      }
    }
    
    return undefined
  }

  private generateDealRecommendations(
    winRates: { date: Date; rate: number; volume: number }[],
    velocity: { avgDaysToClose: number; totalDeals: number }
  ): string[] {
    const recommendations = []
    
    const avgWinRate = winRates.reduce((sum, w) => sum + w.rate, 0) / winRates.length
    const recentWinRate = winRates.slice(-7).reduce((sum, w) => sum + w.rate, 0) / 7
    
    if (recentWinRate < avgWinRate * 0.8) {
      recommendations.push('Win rate declining - Review sales process and provide additional training')
    }
    
    if (velocity.avgDaysToClose > 60) {
      recommendations.push('Long sales cycle - Consider implementing deal acceleration tactics')
    }
    
    if (winRates[winRates.length - 1].volume < winRates[0].volume * 0.7) {
      recommendations.push('Declining deal volume - Increase lead generation activities')
    }
    
    return recommendations
  }

  private mapFactors(factors: any[]): Forecast['factors'] {
    return factors.map(f => ({
      name: f.factor,
      impact: f.weight,
      description: `${f.impact} impact on forecast`
    }))
  }

  private generateSimpleForecast(
    historicalData: { date: Date; value: number }[],
    trendAnalysis: TrendAnalysis,
    horizonDays: number
  ) {
    const avgValue = historicalData.reduce((sum, d) => sum + d.value, 0) / historicalData.length
    const growthRate = trendAnalysis.direction === 'up' ? 1.05 : trendAnalysis.direction === 'down' ? 0.95 : 1
    
    const predictions = []
    for (let i = 1; i <= Math.ceil(horizonDays / 30); i++) {
      predictions.push({
        period: `Month ${i}`,
        value: avgValue * Math.pow(growthRate, i),
        confidence: Math.max(0.5, 0.9 - (i * 0.1)),
        reasoning: 'Simple trend projection'
      })
    }
    
    return {
      predictions,
      keyFactors: [
        { factor: 'Historical Trend', impact: 'positive', weight: 0.8 },
        { factor: 'Market Conditions', impact: 'neutral', weight: 0.2 }
      ],
      recommendations: ['Monitor actual vs forecast closely'],
      accuracy: 0.6
    }
  }

  // Utility functions
  private calculateMovingAverage(
    data: { date: Date; value: number }[],
    window: number
  ): number[] {
    const result = []
    for (let i = window - 1; i < data.length; i++) {
      const sum = data.slice(i - window + 1, i + 1).reduce((s, d) => s + d.value, 0)
      result.push(sum / window)
    }
    return result
  }

  private calculateSlope(data: number[]): number {
    if (data.length < 2) return 0
    
    const n = data.length
    const sumX = (n * (n - 1)) / 2
    const sumY = data.reduce((sum, y) => sum + y, 0)
    const sumXY = data.reduce((sum, y, i) => sum + i * y, 0)
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  }

  private calculateVariance(data: number[]): number {
    const mean = data.reduce((sum, v) => sum + v, 0) / data.length
    const squaredDiffs = data.map(v => Math.pow(v - mean, 2))
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / data.length
  }

  private detectOutliers(data: { date: Date; value: number }[]): TrendAnalysis['outliers'] {
    const values = data.map(d => d.value)
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const stdDev = Math.sqrt(this.calculateVariance(values))
    
    return data
      .filter(d => Math.abs(d.value - mean) > stdDev * 2)
      .map(d => ({
        date: d.date,
        value: d.value,
        deviation: (d.value - mean) / stdDev
      }))
  }

  private getPeriodDays(period: Forecast['period']): number {
    switch (period) {
      case 'daily': return 1
      case 'weekly': return 7
      case 'monthly': return 30
      case 'quarterly': return 90
      default: return 30
    }
  }

  private getSeasonalFactor(date: Date): number {
    const month = date.getMonth()
    // Simple seasonal factors (can be refined with actual data)
    const monthlyFactors = [
      0.9,  // Jan
      0.85, // Feb
      1.0,  // Mar
      1.05, // Apr
      1.1,  // May
      1.15, // Jun
      0.95, // Jul
      0.9,  // Aug
      1.1,  // Sep
      1.05, // Oct
      1.0,  // Nov
      1.2   // Dec
    ]
    return monthlyFactors[month]
  }

  private analyzeMonthlyPattern(data: any[]) {
    const monthlyRevenue = new Map<string, number>()
    
    data.forEach(d => {
      const current = monthlyRevenue.get(d.month) || 0
      monthlyRevenue.set(d.month, current + Number(d.revenue))
    })
    
    const values = Array.from(monthlyRevenue.values())
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = this.calculateVariance(values) / mean
    
    const sortedMonths = Array.from(monthlyRevenue.entries())
      .sort((a, b) => b[1] - a[1])
    
    return {
      variance,
      peaks: sortedMonths.slice(0, 3).map(m => `Month ${m[0]}`),
      lows: sortedMonths.slice(-3).map(m => `Month ${m[0]}`)
    }
  }

  private analyzeWeeklyPattern(data: any[]) {
    const weeklyRevenue = new Map<string, number>()
    
    data.forEach(d => {
      const current = weeklyRevenue.get(d.day_of_week) || 0
      weeklyRevenue.set(d.day_of_week, current + Number(d.revenue))
    })
    
    const values = Array.from(weeklyRevenue.values())
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = this.calculateVariance(values) / mean
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const sortedDays = Array.from(weeklyRevenue.entries())
      .sort((a, b) => b[1] - a[1])
    
    return {
      variance,
      peaks: sortedDays.slice(0, 2).map(d => dayNames[Number(d[0])]),
      lows: sortedDays.slice(-2).map(d => dayNames[Number(d[0])])
    }
  }
}