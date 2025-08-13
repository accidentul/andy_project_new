import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CrmDeal, CrmAccount, CrmContact, CrmActivity } from '../../connectors/unified-crm.entities'
import { AIQueryPlannerService } from '../services/ai-query-planner.service'
import { DynamicSQLBuilder } from '../core/dynamic-sql-builder'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export interface Insight {
  id: string
  type: 'trend' | 'anomaly' | 'pattern' | 'prediction' | 'recommendation'
  severity: 'info' | 'warning' | 'critical' | 'success'
  title: string
  description: string
  impact: string
  metric?: {
    value: number
    change: number
    changePercent: number
    unit?: string
  }
  visualization?: {
    type: 'line' | 'bar' | 'pie' | 'number' | 'gauge'
    data: any
  }
  actions?: {
    label: string
    action: string
    params?: any
  }[]
  confidence: number
  timestamp: Date
  tenantId: string
  department?: string
  priority: number
}

@Injectable()
export class InsightsDiscoveryService {
  private readonly logger = new Logger(InsightsDiscoveryService.name)
  private insights: Map<string, Insight[]> = new Map()

  constructor(
    @InjectRepository(CrmDeal) private dealRepo: Repository<CrmDeal>,
    @InjectRepository(CrmAccount) private accountRepo: Repository<CrmAccount>,
    @InjectRepository(CrmContact) private contactRepo: Repository<CrmContact>,
    @InjectRepository(CrmActivity) private activityRepo: Repository<CrmActivity>,
    private queryPlanner: AIQueryPlannerService,
    private sqlBuilder: DynamicSQLBuilder,
  ) {}

  // Run analysis every 30 minutes
  @Cron(CronExpression.EVERY_30_MINUTES)
  async discoverInsights() {
    this.logger.log('Starting scheduled insights discovery...')
    
    // Get all unique tenant IDs
    const tenants = await this.dealRepo
      .createQueryBuilder('deal')
      .select('DISTINCT deal.tenantId', 'tenantId')
      .getRawMany()
    
    for (const tenant of tenants) {
      await this.analyzeForTenant(tenant.tenantId)
    }
  }

  async analyzeForTenant(tenantId: string): Promise<Insight[]> {
    this.logger.log(`Analyzing data for tenant: ${tenantId}`)
    
    const insights: Insight[] = []
    
    // Run different analysis types in parallel
    const [
      trendInsights,
      anomalyInsights,
      patternInsights,
      predictiveInsights,
      recommendationInsights
    ] = await Promise.all([
      this.detectTrends(tenantId),
      this.detectAnomalies(tenantId),
      this.detectPatterns(tenantId),
      this.generatePredictions(tenantId),
      this.generateRecommendations(tenantId)
    ])
    
    insights.push(
      ...trendInsights,
      ...anomalyInsights,
      ...patternInsights,
      ...predictiveInsights,
      ...recommendationInsights
    )
    
    // Rank insights by priority
    const rankedInsights = this.rankInsights(insights)
    
    // Store insights for quick retrieval
    this.insights.set(tenantId, rankedInsights)
    
    return rankedInsights
  }

  private async detectTrends(tenantId: string): Promise<Insight[]> {
    const insights: Insight[] = []
    
    try {
      // Analyze revenue trend
      const revenueData = await this.dealRepo
        .createQueryBuilder('deal')
        .select("DATE(deal.closeDate) as date, SUM(deal.amount) as revenue")
        .where('deal.tenantId = :tenantId', { tenantId })
        .andWhere('deal.stage = :stage', { stage: 'Closed Won' })
        .andWhere("deal.closeDate >= date('now', '-30 days')")
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany()
      
      if (revenueData.length > 7) {
        // Calculate week-over-week change
        const thisWeek = revenueData.slice(-7).reduce((sum, d) => sum + Number(d.revenue), 0)
        const lastWeek = revenueData.slice(-14, -7).reduce((sum, d) => sum + Number(d.revenue), 0)
        const change = thisWeek - lastWeek
        const changePercent = lastWeek > 0 ? (change / lastWeek) * 100 : 0
        
        if (Math.abs(changePercent) > 10) {
          insights.push({
            id: `trend-revenue-${Date.now()}`,
            type: 'trend',
            severity: changePercent > 0 ? 'success' : 'warning',
            title: `Revenue ${changePercent > 0 ? 'Increased' : 'Decreased'} ${Math.abs(changePercent).toFixed(1)}%`,
            description: `Weekly revenue has ${changePercent > 0 ? 'grown' : 'declined'} from $${lastWeek.toLocaleString()} to $${thisWeek.toLocaleString()}`,
            impact: changePercent > 0 
              ? 'Positive momentum in sales performance'
              : 'May need to review sales strategies',
            metric: {
              value: thisWeek,
              change: change,
              changePercent: changePercent,
              unit: 'USD'
            },
            visualization: {
              type: 'line',
              data: revenueData.map(d => ({
                date: d.date,
                value: Number(d.revenue)
              }))
            },
            confidence: 0.85,
            timestamp: new Date(),
            tenantId,
            priority: Math.abs(changePercent) > 20 ? 1 : 2
          })
        }
      }
      
      // Analyze conversion rate trend
      const conversionData = await this.dealRepo
        .createQueryBuilder('deal')
        .select("DATE(deal.closeDate) as date")
        .addSelect("COUNT(CASE WHEN deal.stage = 'Closed Won' THEN 1 END) as won")
        .addSelect("COUNT(*) as total")
        .where('deal.tenantId = :tenantId', { tenantId })
        .andWhere("deal.closeDate >= date('now', '-30 days')")
        .groupBy('date')
        .getRawMany()
      
      if (conversionData.length > 0) {
        const recentRate = conversionData.slice(-7).reduce((acc, d) => {
          return acc + (Number(d.won) / Number(d.total))
        }, 0) / Math.min(7, conversionData.slice(-7).length)
        
        const historicalRate = conversionData.reduce((acc, d) => {
          return acc + (Number(d.won) / Number(d.total))
        }, 0) / conversionData.length
        
        const rateChange = (recentRate - historicalRate) * 100
        
        if (Math.abs(rateChange) > 5) {
          insights.push({
            id: `trend-conversion-${Date.now()}`,
            type: 'trend',
            severity: rateChange > 0 ? 'success' : 'warning',
            title: `Win Rate ${rateChange > 0 ? 'Improving' : 'Declining'}`,
            description: `Recent win rate is ${(recentRate * 100).toFixed(1)}% compared to ${(historicalRate * 100).toFixed(1)}% average`,
            impact: rateChange > 0
              ? 'Sales effectiveness is improving'
              : 'Review sales process and training',
            metric: {
              value: recentRate * 100,
              change: rateChange,
              changePercent: rateChange,
              unit: '%'
            },
            confidence: 0.75,
            timestamp: new Date(),
            tenantId,
            priority: Math.abs(rateChange) > 10 ? 1 : 3
          })
        }
      }
      
    } catch (error) {
      this.logger.error('Failed to detect trends:', error)
    }
    
    return insights
  }

  private async detectAnomalies(tenantId: string): Promise<Insight[]> {
    const insights: Insight[] = []
    
    try {
      // Detect unusual deal sizes
      const dealStats = await this.dealRepo
        .createQueryBuilder('deal')
        .select('AVG(deal.amount) as avg_amount')
        .addSelect('STDDEV(deal.amount) as std_dev')
        .where('deal.tenantId = :tenantId', { tenantId })
        .getRawOne()
      
      const avgAmount = Number(dealStats.avg_amount)
      const stdDev = Number(dealStats.std_dev)
      
      // Find outlier deals
      const outlierDeals = await this.dealRepo
        .createQueryBuilder('deal')
        .where('deal.tenantId = :tenantId', { tenantId })
        .andWhere('ABS(deal.amount - :avg) > :threshold', {
          avg: avgAmount,
          threshold: stdDev * 2
        })
        .andWhere("deal.createdAt >= date('now', '-7 days')")
        .orderBy('deal.amount', 'DESC')
        .limit(5)
        .getMany()
      
      if (outlierDeals.length > 0) {
        const unusuallyLarge = outlierDeals.filter(d => d.amount > avgAmount + stdDev * 2)
        const unusuallySmall = outlierDeals.filter(d => d.amount < avgAmount - stdDev * 2)
        
        if (unusuallyLarge.length > 0) {
          insights.push({
            id: `anomaly-large-deals-${Date.now()}`,
            type: 'anomaly',
            severity: 'info',
            title: `${unusuallyLarge.length} Unusually Large Deal${unusuallyLarge.length > 1 ? 's' : ''} Detected`,
            description: `Found deals significantly above average ($${avgAmount.toLocaleString()})`,
            impact: 'Potential high-value opportunities requiring special attention',
            metric: {
              value: unusuallyLarge[0].amount,
              change: unusuallyLarge[0].amount - avgAmount,
              changePercent: ((unusuallyLarge[0].amount - avgAmount) / avgAmount) * 100,
              unit: 'USD'
            },
            actions: unusuallyLarge.map(d => ({
              label: `Review ${d.name}`,
              action: 'viewDeal',
              params: { dealId: d.id }
            })),
            confidence: 0.9,
            timestamp: new Date(),
            tenantId,
            priority: 2
          })
        }
      }
      
      // Detect unusual activity patterns
      const activityPattern = await this.activityRepo
        .createQueryBuilder('activity')
        .select("DATE(activity.occurredAt) as date, COUNT(*) as count")
        .where('activity.tenant.id = :tenantId', { tenantId })
        .andWhere("activity.occurredAt >= date('now', '-14 days')")
        .groupBy('date')
        .getRawMany()
      
      if (activityPattern.length > 7) {
        const avgDaily = activityPattern.reduce((sum, d) => sum + Number(d.count), 0) / activityPattern.length
        const today = activityPattern[activityPattern.length - 1]
        
        if (today && Number(today.count) < avgDaily * 0.5) {
          insights.push({
            id: `anomaly-low-activity-${Date.now()}`,
            type: 'anomaly',
            severity: 'warning',
            title: 'Unusually Low Activity Today',
            description: `Only ${today.count} activities today vs ${avgDaily.toFixed(0)} daily average`,
            impact: 'Team engagement may be lower than usual',
            metric: {
              value: Number(today.count),
              change: Number(today.count) - avgDaily,
              changePercent: ((Number(today.count) - avgDaily) / avgDaily) * 100,
              unit: 'activities'
            },
            actions: [{
              label: 'Check Team Status',
              action: 'viewTeamDashboard',
              params: {}
            }],
            confidence: 0.7,
            timestamp: new Date(),
            tenantId,
            priority: 2
          })
        }
      }
      
    } catch (error) {
      this.logger.error('Failed to detect anomalies:', error)
    }
    
    return insights
  }

  private async detectPatterns(tenantId: string): Promise<Insight[]> {
    const insights: Insight[] = []
    
    try {
      // Detect stage bottlenecks
      const stageAnalysis = await this.dealRepo
        .createQueryBuilder('deal')
        .select('deal.stage, COUNT(*) as count, AVG(JULIANDAY("now") - JULIANDAY(deal.createdAt)) as avg_age')
        .where('deal.tenantId = :tenantId', { tenantId })
        .andWhere('deal.stage NOT IN (:...stages)', { stages: ['Closed Won', 'Closed Lost'] })
        .groupBy('deal.stage')
        .getRawMany()
      
      const bottlenecks = stageAnalysis.filter(s => Number(s.avg_age) > 30)
      
      if (bottlenecks.length > 0) {
        const worstBottleneck = bottlenecks.sort((a, b) => Number(b.avg_age) - Number(a.avg_age))[0]
        
        insights.push({
          id: `pattern-bottleneck-${Date.now()}`,
          type: 'pattern',
          severity: 'warning',
          title: `Pipeline Bottleneck at ${worstBottleneck.stage}`,
          description: `${worstBottleneck.count} deals stuck for average ${Number(worstBottleneck.avg_age).toFixed(0)} days`,
          impact: 'Slowing down sales velocity and revenue realization',
          metric: {
            value: Number(worstBottleneck.count),
            change: Number(worstBottleneck.avg_age),
            changePercent: 0,
            unit: 'deals'
          },
          visualization: {
            type: 'bar',
            data: stageAnalysis.map(s => ({
              stage: s.stage,
              count: Number(s.count),
              avgAge: Number(s.avg_age)
            }))
          },
          actions: [{
            label: 'Review Stuck Deals',
            action: 'filterDeals',
            params: { stage: worstBottleneck.stage }
          }],
          confidence: 0.85,
          timestamp: new Date(),
          tenantId,
          priority: 1
        })
      }
      
      // Detect best performing account patterns
      const topAccounts = await this.dealRepo
        .createQueryBuilder('deal')
        .select('deal.accountId, COUNT(*) as deal_count, SUM(deal.amount) as total_value')
        .where('deal.tenantId = :tenantId', { tenantId })
        .andWhere('deal.accountId IS NOT NULL')
        .andWhere('deal.stage = :stage', { stage: 'Closed Won' })
        .groupBy('deal.accountId')
        .having('COUNT(*) > 2')
        .orderBy('total_value', 'DESC')
        .limit(5)
        .getRawMany()
      
      if (topAccounts.length > 0) {
        insights.push({
          id: `pattern-top-accounts-${Date.now()}`,
          type: 'pattern',
          severity: 'success',
          title: 'High-Value Account Pattern Identified',
          description: `${topAccounts.length} accounts generating significant revenue with multiple deals`,
          impact: 'Focus on similar accounts for expansion',
          metric: {
            value: topAccounts.reduce((sum, a) => sum + Number(a.total_value), 0),
            change: 0,
            changePercent: 0,
            unit: 'USD'
          },
          visualization: {
            type: 'bar',
            data: topAccounts.map(a => ({
              account: a.accountId,
              value: Number(a.total_value),
              deals: Number(a.deal_count)
            }))
          },
          confidence: 0.8,
          timestamp: new Date(),
          tenantId,
          priority: 2
        })
      }
      
    } catch (error) {
      this.logger.error('Failed to detect patterns:', error)
    }
    
    return insights
  }

  private async generatePredictions(tenantId: string): Promise<Insight[]> {
    const insights: Insight[] = []
    
    try {
      // Predict monthly target achievement
      const currentMonth = new Date().getMonth()
      const daysInMonth = new Date(new Date().getFullYear(), currentMonth + 1, 0).getDate()
      const daysPassed = new Date().getDate()
      const monthProgress = daysPassed / daysInMonth
      
      const monthlyTarget = 1000000 // This should come from settings
      
      const currentMonthRevenue = await this.dealRepo
        .createQueryBuilder('deal')
        .select('SUM(deal.amount) as revenue')
        .where('deal.tenantId = :tenantId', { tenantId })
        .andWhere('deal.stage = :stage', { stage: 'Closed Won' })
        .andWhere("strftime('%Y-%m', deal.closeDate) = strftime('%Y-%m', 'now')")
        .getRawOne()
      
      const actualRevenue = Number(currentMonthRevenue?.revenue || 0)
      const expectedRevenue = monthlyTarget * monthProgress
      const projectedMonthEnd = actualRevenue / monthProgress
      
      if (projectedMonthEnd < monthlyTarget * 0.9) {
        const gap = monthlyTarget - projectedMonthEnd
        const gapPercent = (gap / monthlyTarget) * 100
        
        insights.push({
          id: `prediction-target-${Date.now()}`,
          type: 'prediction',
          severity: 'warning',
          title: 'Monthly Target at Risk',
          description: `Projected to miss target by $${gap.toLocaleString()} (${gapPercent.toFixed(1)}%)`,
          impact: 'Need to accelerate deal closures or find new opportunities',
          metric: {
            value: projectedMonthEnd,
            change: projectedMonthEnd - monthlyTarget,
            changePercent: -gapPercent,
            unit: 'USD'
          },
          visualization: {
            type: 'gauge',
            data: {
              value: actualRevenue,
              target: monthlyTarget,
              projected: projectedMonthEnd
            }
          },
          actions: [
            {
              label: 'View Pipeline',
              action: 'viewPipeline',
              params: {}
            },
            {
              label: 'Accelerate Deals',
              action: 'filterDeals',
              params: { stage: 'Negotiation' }
            }
          ],
          confidence: 0.75,
          timestamp: new Date(),
          tenantId,
          priority: 1
        })
      }
      
      // Predict deal closure probability
      const openDeals = await this.dealRepo
        .createQueryBuilder('deal')
        .where('deal.tenantId = :tenantId', { tenantId })
        .andWhere('deal.stage NOT IN (:...stages)', { stages: ['Closed Won', 'Closed Lost'] })
        .andWhere('deal.closeDate <= :nextMonth', { 
          nextMonth: new Date(new Date().setMonth(new Date().getMonth() + 1))
        })
        .getMany()
      
      if (openDeals.length > 0) {
        // Simple scoring based on stage and age
        const stageScores: Record<string, number> = {
          'Prospecting': 0.1,
          'Qualification': 0.25,
          'Proposal': 0.5,
          'Negotiation': 0.75,
        }
        
        let likelyToClose = 0
        let atRisk = 0
        
        for (const deal of openDeals) {
          const stageScore = stageScores[deal.stage || 'Prospecting'] || 0.1
          const ageInDays = Math.floor((Date.now() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          const ageScore = ageInDays > 60 ? 0.5 : 1
          const probability = stageScore * ageScore
          
          if (probability > 0.5) likelyToClose++
          else atRisk++
        }
        
        if (atRisk > likelyToClose) {
          insights.push({
            id: `prediction-deals-risk-${Date.now()}`,
            type: 'prediction',
            severity: 'warning',
            title: `${atRisk} Deals at Risk`,
            description: `${atRisk} of ${openDeals.length} deals unlikely to close this month`,
            impact: 'Revenue forecast may need adjustment',
            metric: {
              value: atRisk,
              change: 0,
              changePercent: (atRisk / openDeals.length) * 100,
              unit: 'deals'
            },
            actions: [{
              label: 'Review At-Risk Deals',
              action: 'viewAtRiskDeals',
              params: {}
            }],
            confidence: 0.65,
            timestamp: new Date(),
            tenantId,
            priority: 2
          })
        }
      }
      
    } catch (error) {
      this.logger.error('Failed to generate predictions:', error)
    }
    
    return insights
  }

  private async generateRecommendations(tenantId: string): Promise<Insight[]> {
    const insights: Insight[] = []
    
    try {
      // Use AI to generate strategic recommendations
      const context = await this.gatherBusinessContext(tenantId)
      
      const prompt = `Based on this business data, provide 2-3 strategic recommendations:
      ${JSON.stringify(context, null, 2)}
      
      Format each recommendation as:
      - Title: [Brief title]
      - Action: [Specific action to take]
      - Impact: [Expected business impact]`
      
      const response = await generateText({
        model: openai('gpt-4o-mini'),
        prompt,
        temperature: 0.7,
      })
      
      // Parse AI recommendations
      const recommendations = this.parseRecommendations(response.text)
      
      for (const rec of recommendations) {
        insights.push({
          id: `recommendation-${Date.now()}-${Math.random()}`,
          type: 'recommendation',
          severity: 'info',
          title: rec.title,
          description: rec.action,
          impact: rec.impact,
          confidence: 0.7,
          timestamp: new Date(),
          tenantId,
          priority: 3,
          actions: [{
            label: 'View Details',
            action: 'showRecommendation',
            params: { recommendation: rec }
          }]
        })
      }
      
    } catch (error) {
      this.logger.error('Failed to generate recommendations:', error)
    }
    
    return insights
  }

  private async gatherBusinessContext(tenantId: string) {
    const [dealStats, activityStats, recentWins] = await Promise.all([
      this.dealRepo
        .createQueryBuilder('deal')
        .select('COUNT(*) as total, AVG(amount) as avg_amount')
        .where('deal.tenantId = :tenantId', { tenantId })
        .getRawOne(),
      
      this.activityRepo
        .createQueryBuilder('activity')
        .select('COUNT(*) as total, type, COUNT(*) as count')
        .where('activity.tenant.id = :tenantId', { tenantId })
        .andWhere("activity.occurredAt >= date('now', '-7 days')")
        .groupBy('type')
        .getRawMany(),
      
      this.dealRepo
        .createQueryBuilder('deal')
        .where('deal.tenantId = :tenantId', { tenantId })
        .andWhere('deal.stage = :stage', { stage: 'Closed Won' })
        .andWhere("deal.closeDate >= date('now', '-30 days')")
        .limit(5)
        .getMany()
    ])
    
    return {
      totalDeals: dealStats.total,
      avgDealSize: dealStats.avg_amount,
      weeklyActivities: activityStats,
      recentWins: recentWins.length,
      recentWinValue: recentWins.reduce((sum, d) => sum + d.amount, 0)
    }
  }

  private parseRecommendations(text: string): any[] {
    const recommendations = []
    const lines = text.split('\n')
    
    let current: any = {}
    for (const line of lines) {
      if (line.includes('Title:')) {
        if (current.title) recommendations.push(current)
        current = { title: line.replace('Title:', '').trim() }
      } else if (line.includes('Action:')) {
        current.action = line.replace('Action:', '').trim()
      } else if (line.includes('Impact:')) {
        current.impact = line.replace('Impact:', '').trim()
      }
    }
    
    if (current.title) recommendations.push(current)
    
    return recommendations.slice(0, 3)
  }

  private rankInsights(insights: Insight[]): Insight[] {
    return insights.sort((a, b) => {
      // First sort by priority
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      
      // Then by severity
      const severityOrder = { critical: 0, warning: 1, success: 2, info: 3 }
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff
      
      // Then by confidence
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence
      }
      
      // Finally by timestamp (newest first)
      return b.timestamp.getTime() - a.timestamp.getTime()
    })
  }

  async getInsightsForTenant(tenantId: string, limit = 10): Promise<Insight[]> {
    // Check cache first
    const cached = this.insights.get(tenantId)
    if (cached && cached.length > 0) {
      const recentCache = cached.filter(i => 
        Date.now() - i.timestamp.getTime() < 30 * 60 * 1000 // 30 minutes
      )
      
      if (recentCache.length > 0) {
        return recentCache.slice(0, limit)
      }
    }
    
    // Generate fresh insights
    const freshInsights = await this.analyzeForTenant(tenantId)
    return freshInsights.slice(0, limit)
  }

  async getInsightsByType(tenantId: string, type: Insight['type']): Promise<Insight[]> {
    const allInsights = await this.getInsightsForTenant(tenantId, 100)
    return allInsights.filter(i => i.type === type)
  }

  async getInsightsByDepartment(tenantId: string, department: string): Promise<Insight[]> {
    const allInsights = await this.getInsightsForTenant(tenantId, 100)
    return allInsights.filter(i => !i.department || i.department === department)
  }
}