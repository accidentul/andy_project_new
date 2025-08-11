import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between, MoreThan } from 'typeorm'
import { CrmAccount, CrmActivity, CrmContact, CrmDeal } from '../connectors/unified-crm.entities'

export type SuggestedWidget = {
  id: string
  title: string
  size: 'tiny' | 'small' | 'medium' | 'large'
  type: 'line' | 'bar' | 'area' | 'kpi'
  description: string
  data: any
}

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(CrmAccount) private readonly accountRepo: Repository<CrmAccount>,
    @InjectRepository(CrmContact) private readonly contactRepo: Repository<CrmContact>,
    @InjectRepository(CrmDeal) private readonly dealRepo: Repository<CrmDeal>,
    @InjectRepository(CrmActivity) private readonly activityRepo: Repository<CrmActivity>,
  ) {}

  async generateCrmWidgetSuggestions(tenantId: string): Promise<SuggestedWidget[]> {
    // 1) Basic KPIs
    const last90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const now = new Date()

    const deals = await this.dealRepo.find({ where: { tenant: { id: tenantId } } })
    const activities = await this.activityRepo.find({ where: { tenant: { id: tenantId }, occurredAt: MoreThan(last90) } })

    const totalPipeline = deals.reduce((sum, d) => sum + Number(d.amount || 0), 0)
    const wonDeals = deals.filter((d) => (d.stage || '').toLowerCase().includes('won')).length
    const lostDeals = deals.filter((d) => (d.stage || '').toLowerCase().includes('lost')).length

    const dailyActivities: Record<string, number> = {}
    for (const a of activities) {
      const day = new Date(a.occurredAt).toISOString().slice(0, 10)
      dailyActivities[day] = (dailyActivities[day] || 0) + 1
    }
    const activitySeries = Object.entries(dailyActivities)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([day, value]) => ({ day, value }))

    const suggestions: SuggestedWidget[] = []

    // KPI: Total Pipeline
    suggestions.push({
      id: 'kpi-total-pipeline',
      title: 'Total Pipeline',
      size: 'small',
      type: 'kpi',
      description: 'Sum of all open deal amounts',
      data: { value: totalPipeline },
    })

    // KPI: Win/Loss Ratio
    const winLoss = wonDeals + lostDeals > 0 ? wonDeals / (wonDeals + lostDeals) : 0
    suggestions.push({
      id: 'kpi-win-loss',
      title: 'Win/Loss Ratio',
      size: 'small',
      type: 'kpi',
      description: 'Won vs lost deals ratio',
      data: { value: Number((winLoss * 100).toFixed(1)) },
    })

    // Series: Activities last 90 days
    suggestions.push({
      id: 'activity-trend-90d',
      title: 'Sales Activities (90d)',
      size: 'medium',
      type: 'line',
      description: 'Trend of CRM activities over the last 90 days',
      data: activitySeries,
    })

    // Funnel: deals by stage
    const stageCounts: Record<string, number> = {}
    for (const d of deals) {
      const s = (d.stage || 'Unknown').trim()
      stageCounts[s] = (stageCounts[s] || 0) + 1
    }
    suggestions.push({
      id: 'deals-by-stage',
      title: 'Deals by Stage',
      size: 'medium',
      type: 'bar',
      description: 'Distribution of deals across stages',
      data: Object.entries(stageCounts).map(([stage, value]) => ({ stage, value })),
    })

    // Forecast (simple): next month pipeline = avg of last 3 months
    const byMonth: Record<string, number> = {}
    for (const d of deals) {
      const m = (d.closeDate || new Date()).toString()
      const month = new Date(m).toISOString().slice(0, 7)
      byMonth[month] = (byMonth[month] || 0) + Number(d.amount || 0)
    }
    const orderedMonths = Object.keys(byMonth).sort()
    const last3 = orderedMonths.slice(-3)
    const avg = last3.length ? last3.reduce((s, m) => s + byMonth[m], 0) / last3.length : 0
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const nextMonthKey = nextMonth.toISOString().slice(0, 7)
    suggestions.push({
      id: 'pipeline-forecast',
      title: 'Pipeline Forecast (naive)',
      size: 'medium',
      type: 'area',
      description: 'Simple next-month forecast using last 3 months average',
      data: [...orderedMonths.map((m) => ({ month: m, value: byMonth[m] })), { month: nextMonthKey, value: avg }],
    })

    return suggestions
  }

  async seedSampleData(
    tenantId: string,
    connectorId: string,
    provider: 'salesforce' | 'hubspot',
    options?: {
      volume?: 'small' | 'medium' | 'large'
      accounts?: number
      contacts?: number
      deals?: number
      activityDays?: number
      minActivitiesPerDay?: number
      maxActivitiesPerDay?: number
    },
  ) {
    const volume = options?.volume || 'large'
    const ACC = options?.accounts ?? (volume === 'large' ? 200 : volume === 'medium' ? 80 : 20)
    const CON = options?.contacts ?? (volume === 'large' ? 800 : volume === 'medium' ? 300 : 80)
    const DEAL = options?.deals ?? (volume === 'large' ? 1200 : volume === 'medium' ? 400 : 100)
    const DAYS = options?.activityDays ?? (volume === 'large' ? 365 : volume === 'medium' ? 120 : 45)
    const MIN_PD = options?.minActivitiesPerDay ?? (volume === 'large' ? 20 : 5)
    const MAX_PD = options?.maxActivitiesPerDay ?? (volume === 'large' ? 120 : 25)

    const industries = ['Software', 'Manufacturing', 'Energy', 'Retail', 'Healthcare', 'Finance', 'Logistics']

    // Accounts
    for (let i = 0; i < ACC; i++) {
      const name = `Account ${i + 1}`
      const website = `acc${i + 1}.example.com`
      const industry = industries[i % industries.length]
      await this.accountRepo.save(
        this.accountRepo.create({ tenant: { id: tenantId } as any, provider, connectorId, name, website, industry, externalId: `acc-${i}` }),
      )
    }

    // Contacts
    for (let i = 0; i < CON; i++) {
      const firstName = `User${i + 1}`
      const lastName = `Last${(i % 500) + 1}`
      const email = `user${i + 1}@acc${(i % ACC) + 1}.example.com`
      await this.contactRepo.save(
        this.contactRepo.create({ tenant: { id: tenantId } as any, provider, connectorId, firstName, lastName, email, externalId: `con-${i}` }),
      )
    }

    // Deals spread across months and stages
    const stages = ['Prospecting', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
    const now = new Date()
    for (let i = 0; i < DEAL; i++) {
      const monthsAgo = Math.floor(Math.random() * 18) // last 18 months
      const closeDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1 + Math.floor(Math.random() * 27))
      const stage = stages[i % stages.length]
      const amount = Math.floor(5000 + Math.random() * 200000)
      await this.dealRepo.save(
        this.dealRepo.create({
          tenant: { id: tenantId } as any,
          provider,
          connectorId,
          name: `Deal ${i + 1}`,
          amount,
          stage,
          closeDate: closeDate as any,
          externalId: `deal-${i}`,
        }),
      )
    }

    // Activities time series
    for (let d = 0; d < DAYS; d++) {
      const day = new Date(now)
      day.setDate(now.getDate() - d)
      const count = Math.floor(MIN_PD + Math.random() * (MAX_PD - MIN_PD + 1))
      for (let j = 0; j < count; j++) {
        await this.activityRepo.save(
          this.activityRepo.create({
            tenant: { id: tenantId } as any,
            provider,
            connectorId,
            type: ['call', 'email', 'meeting'][(j + d) % 3],
            occurredAt: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 8 + (j % 10)),
            subject: 'Touchpoint',
            notes: 'Seeded',
          }),
        )
      }
    }
  }
}
