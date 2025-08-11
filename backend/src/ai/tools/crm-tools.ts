import { DynamicStructuredTool, DynamicTool } from '@langchain/core/tools'
import { z } from 'zod'
import { Repository } from 'typeorm'
import { CrmAccount, CrmContact, CrmDeal, CrmActivity } from '../../connectors/unified-crm.entities'

export function createCrmTools(
  accountRepo: Repository<CrmAccount>,
  contactRepo: Repository<CrmContact>,
  dealRepo: Repository<CrmDeal>,
  activityRepo: Repository<CrmActivity>,
  tenantId: string
) {
  // Search Deals Tool
  const searchDeals = new DynamicStructuredTool({
    name: 'search_deals',
    description: 'Search for deals in the CRM by stage, amount, or other criteria',
    schema: z.object({
      stage: z.string().optional().describe('Filter by deal stage (e.g., "Qualified", "Won", "Lost")'),
      minAmount: z.number().optional().describe('Minimum deal amount'),
      maxAmount: z.number().optional().describe('Maximum deal amount'),
      limit: z.number().default(10).describe('Maximum number of results to return')
    }),
    func: async ({ stage, minAmount, maxAmount, limit }) => {
      let query = dealRepo.createQueryBuilder('deal')
        .where('deal.tenantId = :tenantId', { tenantId })
      
      if (stage) {
        query = query.andWhere('LOWER(deal.stage) LIKE :stage', { stage: `%${stage.toLowerCase()}%` })
      }
      
      if (minAmount !== undefined) {
        query = query.andWhere('deal.amount >= :minAmount', { minAmount })
      }
      
      if (maxAmount !== undefined) {
        query = query.andWhere('deal.amount <= :maxAmount', { maxAmount })
      }
      
      const deals = await query
        .orderBy('deal.amount', 'DESC')
        .limit(limit)
        .getMany()
      
      return JSON.stringify({
        count: deals.length,
        totalValue: deals.reduce((sum, d) => sum + Number(d.amount), 0),
        deals: deals.map(d => ({
          id: d.id,
          name: d.name,
          amount: d.amount,
          stage: d.stage,
          closeDate: d.closeDate
        }))
      })
    }
  })

  // Get Revenue Metrics Tool
  const getRevenueMetrics = new DynamicTool({
    name: 'get_revenue_metrics',
    description: 'Get revenue metrics including total revenue, pipeline value, and win rate',
    func: async () => {
      const deals = await dealRepo.find({ where: { tenant: { id: tenantId } } })
      
      const wonDeals = deals.filter(d => d.stage?.toLowerCase().includes('won'))
      const lostDeals = deals.filter(d => d.stage?.toLowerCase().includes('lost'))
      const openDeals = deals.filter(d => 
        !d.stage?.toLowerCase().includes('closed') && 
        !d.stage?.toLowerCase().includes('won') && 
        !d.stage?.toLowerCase().includes('lost')
      )
      
      const totalRevenue = wonDeals.reduce((sum, d) => sum + Number(d.amount), 0)
      const pipelineValue = openDeals.reduce((sum, d) => sum + Number(d.amount), 0)
      const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0
      
      return JSON.stringify({
        totalRevenue,
        pipelineValue,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
        openDeals: openDeals.length,
        winRate: Math.round(winRate),
        avgDealSize: wonDeals.length > 0 ? Math.round(totalRevenue / wonDeals.length) : 0
      })
    }
  })

  // Create Deal Tool
  const createDeal = new DynamicStructuredTool({
    name: 'create_deal',
    description: 'Create a new deal in the CRM',
    schema: z.object({
      name: z.string().describe('Name of the deal'),
      amount: z.number().describe('Deal amount in dollars'),
      stage: z.string().default('Qualification').describe('Deal stage'),
      closeDate: z.string().optional().describe('Expected close date (YYYY-MM-DD)')
    }),
    func: async ({ name, amount, stage, closeDate }) => {
      const deal = dealRepo.create({
        tenant: { id: tenantId },
        name,
        amount,
        stage,
        closeDate,
        provider: 'salesforce',
        connectorId: 'ai-created'
      })
      
      await dealRepo.save(deal)
      
      return `Deal "${name}" created successfully with amount $${amount} in ${stage} stage`
    }
  })

  // Update Deal Stage Tool
  const updateDealStage = new DynamicStructuredTool({
    name: 'update_deal_stage',
    description: 'Update the stage of an existing deal',
    schema: z.object({
      dealId: z.string().describe('ID of the deal to update'),
      newStage: z.string().describe('New stage for the deal')
    }),
    func: async ({ dealId, newStage }) => {
      const deal = await dealRepo.findOne({ 
        where: { id: dealId, tenant: { id: tenantId } } 
      })
      
      if (!deal) {
        return `Deal ${dealId} not found`
      }
      
      const oldStage = deal.stage
      deal.stage = newStage
      await dealRepo.save(deal)
      
      // Log the change as an activity
      const activity = activityRepo.create({
        tenant: { id: tenantId },
        type: 'note',
        occurredAt: new Date(),
        subject: `Deal stage updated: ${oldStage} → ${newStage}`,
        notes: `Deal "${deal.name}" stage changed by AI assistant`,
        provider: 'salesforce',
        connectorId: 'ai-created'
      })
      await activityRepo.save(activity)
      
      return `Deal "${deal.name}" stage updated from ${oldStage} to ${newStage}`
    }
  })

  // Search Contacts Tool
  const searchContacts = new DynamicStructuredTool({
    name: 'search_contacts',
    description: 'Search for contacts in the CRM',
    schema: z.object({
      email: z.string().optional().describe('Search by email address'),
      name: z.string().optional().describe('Search by first or last name'),
      limit: z.number().default(10).describe('Maximum number of results')
    }),
    func: async ({ email, name, limit }) => {
      let query = contactRepo.createQueryBuilder('contact')
        .where('contact.tenantId = :tenantId', { tenantId })
      
      if (email) {
        query = query.andWhere('contact.email LIKE :email', { email: `%${email}%` })
      }
      
      if (name) {
        query = query.andWhere(
          '(LOWER(contact.firstName) LIKE :name OR LOWER(contact.lastName) LIKE :name)',
          { name: `%${name.toLowerCase()}%` }
        )
      }
      
      const contacts = await query.limit(limit).getMany()
      
      return JSON.stringify({
        count: contacts.length,
        contacts: contacts.map(c => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
          phone: c.phone
        }))
      })
    }
  })

  // Create Contact Tool
  const createContact = new DynamicStructuredTool({
    name: 'create_contact',
    description: 'Create a new contact in the CRM',
    schema: z.object({
      firstName: z.string().describe('First name'),
      lastName: z.string().describe('Last name'),
      email: z.string().describe('Email address'),
      phone: z.string().optional().describe('Phone number')
    }),
    func: async ({ firstName, lastName, email, phone }) => {
      const contact = contactRepo.create({
        tenant: { id: tenantId },
        firstName,
        lastName,
        email,
        phone,
        provider: 'salesforce',
        connectorId: 'ai-created'
      })
      
      await contactRepo.save(contact)
      
      return `Contact "${firstName} ${lastName}" created successfully with email ${email}`
    }
  })

  // Get Account Metrics Tool
  const getAccountMetrics = new DynamicTool({
    name: 'get_account_metrics',
    description: 'Get metrics about accounts in the CRM',
    func: async () => {
      const accounts = await accountRepo.find({ where: { tenant: { id: tenantId } } })
      
      const industries = accounts.reduce((acc, a) => {
        const industry = a.industry || 'Unknown'
        acc[industry] = (acc[industry] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      return JSON.stringify({
        totalAccounts: accounts.length,
        byIndustry: industries,
        topAccounts: accounts.slice(0, 5).map(a => ({
          name: a.name,
          website: a.website,
          industry: a.industry
        }))
      })
    }
  })

  // Create Activity Tool
  const createActivity = new DynamicStructuredTool({
    name: 'create_activity',
    description: 'Create a new activity (call, email, meeting, task)',
    schema: z.object({
      type: z.enum(['call', 'email', 'meeting', 'task', 'note']).describe('Type of activity'),
      subject: z.string().describe('Subject or title of the activity'),
      notes: z.string().optional().describe('Additional notes or description'),
      date: z.string().optional().describe('Date of activity (YYYY-MM-DD)')
    }),
    func: async ({ type, subject, notes, date }) => {
      const activity = activityRepo.create({
        tenant: { id: tenantId },
        type,
        occurredAt: date ? new Date(date) : new Date(),
        subject,
        notes,
        provider: 'salesforce',
        connectorId: 'ai-created'
      })
      
      await activityRepo.save(activity)
      
      return `${type} activity "${subject}" created successfully`
    }
  })

  // Get Recent Activities Tool
  const getRecentActivities = new DynamicStructuredTool({
    name: 'get_recent_activities',
    description: 'Get recent activities from the CRM',
    schema: z.object({
      type: z.string().optional().describe('Filter by activity type'),
      days: z.number().default(7).describe('Number of days to look back'),
      limit: z.number().default(10).describe('Maximum number of results')
    }),
    func: async ({ type, days, limit }) => {
      const since = new Date()
      since.setDate(since.getDate() - days)
      
      let query = activityRepo.createQueryBuilder('activity')
        .where('activity.tenantId = :tenantId', { tenantId })
        .andWhere('activity.occurredAt >= :since', { since })
      
      if (type) {
        query = query.andWhere('activity.type = :type', { type })
      }
      
      const activities = await query
        .orderBy('activity.occurredAt', 'DESC')
        .limit(limit)
        .getMany()
      
      return JSON.stringify({
        count: activities.length,
        activities: activities.map(a => ({
          id: a.id,
          type: a.type,
          subject: a.subject,
          notes: a.notes,
          date: a.occurredAt
        }))
      })
    }
  })

  return [
    searchDeals,
    getRevenueMetrics,
    createDeal,
    updateDealStage,
    searchContacts,
    createContact,
    getAccountMetrics,
    createActivity,
    getRecentActivities
  ]
}