import { z } from 'zod'
import { BaseTool, ToolContext, ToolResult } from './base.tool'
import { CrmAccount, CrmContact, CrmDeal, CrmActivity } from '../../connectors/unified-crm.entities'

export class GetCrmAccountsTool extends BaseTool {
  name = 'get_crm_accounts'
  description = 'Retrieve CRM accounts with optional filtering'
  parameters = z.object({
    limit: z.number().optional().default(10),
    industry: z.string().optional(),
    minRevenue: z.number().optional(),
  })

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { limit, industry, minRevenue } = params
    const accountRepo = context.repositories?.crmAccount

    if (!accountRepo) {
      return { success: false, error: 'CRM Account repository not available' }
    }

    try {
      const query = accountRepo.createQueryBuilder('account')
        .leftJoinAndSelect('account.tenant', 'tenant')
        .where('tenant.id = :tenantId', { tenantId: context.tenantId })
        .limit(limit)

      if (industry) {
        query.andWhere('account.industry = :industry', { industry })
      }

      if (minRevenue) {
        query.andWhere('account.annualRevenue >= :minRevenue', { minRevenue })
      }

      const accounts = await query.getMany()

      return {
        success: true,
        data: accounts,
        message: `Retrieved ${accounts.length} accounts`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve accounts',
      }
    }
  }
}

export class GetCrmDealsTool extends BaseTool {
  name = 'get_crm_deals'
  description = 'Retrieve CRM deals/opportunities with optional filtering'
  parameters = z.object({
    limit: z.number().optional().default(10),
    stage: z.string().optional(),
    minAmount: z.number().optional(),
    maxAmount: z.number().optional(),
  })

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { limit, stage, minAmount, maxAmount } = params
    const dealRepo = context.repositories?.crmDeal

    if (!dealRepo) {
      return { success: false, error: 'CRM Deal repository not available' }
    }

    try {
      const query = dealRepo.createQueryBuilder('deal')
        .leftJoinAndSelect('deal.tenant', 'tenant')
        .where('tenant.id = :tenantId', { tenantId: context.tenantId })
        .limit(limit)

      if (stage) {
        query.andWhere('deal.stage = :stage', { stage })
      }

      if (minAmount) {
        query.andWhere('deal.amount >= :minAmount', { minAmount })
      }

      if (maxAmount) {
        query.andWhere('deal.amount <= :maxAmount', { maxAmount })
      }

      const deals = await query.getMany()

      const totalValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0)

      return {
        success: true,
        data: {
          deals,
          summary: {
            count: deals.length,
            totalValue,
            averageValue: deals.length > 0 ? totalValue / deals.length : 0,
          },
        },
        message: `Retrieved ${deals.length} deals worth $${totalValue.toFixed(2)}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve deals',
      }
    }
  }
}

export class CreateCrmActivityTool extends BaseTool {
  name = 'create_crm_activity'
  description = 'Create a new CRM activity (call, meeting, email, etc.)'
  parameters = z.object({
    type: z.enum(['call', 'meeting', 'email', 'task']),
    subject: z.string(),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    contactId: z.string().optional(),
    dealId: z.string().optional(),
  })

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const activityRepo = context.repositories?.crmActivity

    if (!activityRepo) {
      return { success: false, error: 'CRM Activity repository not available' }
    }

    try {
      const activity = activityRepo.create({
        type: params.type,
        subject: params.subject,
        notes: params.description,
        tenant: { id: context.tenantId },
        provider: 'salesforce' as any, // Default provider
        connectorId: 'default',
        occurredAt: new Date(),
      })

      await activityRepo.save(activity)

      return {
        success: true,
        data: activity,
        message: `Created ${params.type} activity: ${params.subject}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create activity',
      }
    }
  }
}

export class AnalyzeSalesPipelineTool extends BaseTool {
  name = 'analyze_sales_pipeline'
  description = 'Analyze the sales pipeline and provide insights'
  parameters = z.object({
    groupBy: z.enum(['stage', 'owner', 'month']).optional().default('stage'),
  })

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const dealRepo = context.repositories?.crmDeal

    if (!dealRepo) {
      // Return success with empty data when no repository is available
      return {
        success: true,
        data: {
          stageAnalysis: {},
          metrics: {
            totalPipeline: 0,
            wonDeals: 0,
            lostDeals: 0,
            winRate: 0,
            avgDealSize: 0,
          },
          recommendations: ['No data available yet. Start by adding some deals to the CRM.'],
        },
        message: 'No CRM data available yet',
      }
    }

    try {
      const deals = await dealRepo.find({
        where: { tenant: { id: context.tenantId } },
        relations: ['tenant'],
      })

      const stageAnalysis: Record<string, any> = {}
      const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']

      stages.forEach(stage => {
        const stageDeals = deals.filter(d => d.stage === stage)
        stageAnalysis[stage] = {
          count: stageDeals.length,
          value: stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
          avgDaysInStage: 0, // Would calculate from activity history
        }
      })

      const metrics = {
        totalPipeline: deals.filter(d => !d.stage?.includes('Closed')).reduce((sum, d) => sum + (d.amount || 0), 0),
        wonDeals: deals.filter(d => d.stage === 'Closed Won').length,
        lostDeals: deals.filter(d => d.stage === 'Closed Lost').length,
        winRate: deals.length > 0 ? 
          (deals.filter(d => d.stage === 'Closed Won').length / deals.filter(d => d.stage?.includes('Closed')).length) * 100 : 0,
        avgDealSize: deals.length > 0 ? deals.reduce((sum, d) => sum + (d.amount || 0), 0) / deals.length : 0,
      }

      return {
        success: true,
        data: {
          stageAnalysis,
          metrics,
          recommendations: [
            metrics.winRate < 20 ? 'Focus on qualification - win rate is below 20%' : null,
            stageAnalysis['Proposal'].count > 20 ? 'High number of deals stuck in Proposal stage' : null,
            metrics.avgDealSize < 10000 ? 'Consider targeting larger opportunities' : null,
          ].filter(Boolean),
        },
        message: `Pipeline analysis complete: $${metrics.totalPipeline.toFixed(2)} in pipeline`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze pipeline',
      }
    }
  }
}