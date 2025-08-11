import { DynamicStructuredTool, DynamicTool } from '@langchain/core/tools'
import { z } from 'zod'
import * as fs from 'fs/promises'
import * as path from 'path'
import { Repository } from 'typeorm'
import { CrmAccount, CrmContact, CrmDeal, CrmActivity } from '../../connectors/unified-crm.entities'

export function createBusinessTools(
  dealRepo: Repository<CrmDeal>,
  accountRepo: Repository<CrmAccount>,
  contactRepo: Repository<CrmContact>,
  activityRepo: Repository<CrmActivity>,
  tenantId: string
) {
  // Generate Board Presentation Tool
  const generateBoardPresentation = new DynamicStructuredTool({
    name: 'generate_board_presentation',
    description: 'Generate an executive board presentation with current metrics and insights',
    schema: z.object({
      includeForecasts: z.boolean().default(true).describe('Include revenue forecasts'),
      includeRisks: z.boolean().default(true).describe('Include risk analysis')
    }),
    func: async ({ includeForecasts, includeRisks }) => {
      // Gather real metrics
      const [deals, accounts, contacts, activities] = await Promise.all([
        dealRepo.find({ where: { tenant: { id: tenantId } } }),
        accountRepo.find({ where: { tenant: { id: tenantId } } }),
        contactRepo.find({ where: { tenant: { id: tenantId } } }),
        activityRepo.find({ 
          where: { tenant: { id: tenantId } },
          order: { occurredAt: 'DESC' },
          take: 100
        })
      ])
      
      const wonDeals = deals.filter(d => d.stage?.toLowerCase().includes('won'))
      const totalRevenue = wonDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0)
      const pipelineValue = deals
        .filter(d => !d.stage?.toLowerCase().includes('closed'))
        .reduce((sum, d) => sum + Number(d.amount || 0), 0)
      
      const presentation = {
        title: 'Executive Board Presentation',
        date: new Date().toISOString(),
        executive_summary: {
          revenue: totalRevenue,
          pipeline: pipelineValue,
          accounts: accounts.length,
          contacts: contacts.length,
          win_rate: deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0
        },
        key_metrics: {
          total_revenue: `$${(totalRevenue / 1000000).toFixed(2)}M`,
          pipeline_value: `$${(pipelineValue / 1000000).toFixed(2)}M`,
          customer_base: `${accounts.length} accounts, ${contacts.length} contacts`,
          sales_efficiency: `${wonDeals.length} deals closed`,
          activity_level: `${activities.length} activities in last 100`
        },
        insights: [
          `Revenue achievement: $${(totalRevenue / 1000000).toFixed(2)}M closed to date`,
          `Pipeline coverage: $${(pipelineValue / 1000000).toFixed(2)}M in active opportunities`,
          `Win rate trending at ${Math.round((wonDeals.length / Math.max(deals.length, 1)) * 100)}%`,
          `Customer engagement: ${activities.length} touchpoints tracked`
        ]
      }
      
      if (includeForecasts) {
        const winRate = wonDeals.length / Math.max(deals.length, 1)
        presentation['forecast'] = {
          next_quarter: pipelineValue * winRate * 0.3,
          full_year: totalRevenue + (pipelineValue * winRate * 0.7),
          confidence: 'Medium'
        }
      }
      
      if (includeRisks) {
        const risks = []
        if (pipelineValue < totalRevenue * 2) {
          risks.push('Pipeline coverage below 2x - need more opportunities')
        }
        if (activities.length < deals.length * 5) {
          risks.push('Low activity-to-deal ratio - increase engagement')
        }
        presentation['risks'] = risks
      }
      
      // Save presentation
      const outputDir = path.join(process.cwd(), 'data', 'presentations')
      await fs.mkdir(outputDir, { recursive: true })
      const filename = `board-presentation-${Date.now()}.json`
      await fs.writeFile(
        path.join(outputDir, filename),
        JSON.stringify(presentation, null, 2)
      )
      
      return JSON.stringify({
        success: true,
        message: 'Board presentation generated',
        filename,
        path: `/data/presentations/${filename}`,
        summary: presentation.executive_summary
      })
    }
  })

  // Generate Sales Report Tool
  const generateSalesReport = new DynamicStructuredTool({
    name: 'generate_sales_report',
    description: 'Generate a detailed sales performance report',
    schema: z.object({
      period: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).default('monthly'),
      includeDetails: z.boolean().default(true)
    }),
    func: async ({ period, includeDetails }) => {
      const deals = await dealRepo.find({ where: { tenant: { id: tenantId } } })
      const activities = await activityRepo.find({ 
        where: { tenant: { id: tenantId } },
        order: { occurredAt: 'DESC' },
        take: 200
      })
      
      const wonDeals = deals.filter(d => d.stage?.toLowerCase().includes('won'))
      const lostDeals = deals.filter(d => d.stage?.toLowerCase().includes('lost'))
      const openDeals = deals.filter(d => 
        !d.stage?.toLowerCase().includes('closed') && 
        !d.stage?.toLowerCase().includes('won') && 
        !d.stage?.toLowerCase().includes('lost')
      )
      
      const report = {
        type: 'Sales Performance Report',
        period,
        generated: new Date().toISOString(),
        summary: {
          total_deals: deals.length,
          won_deals: wonDeals.length,
          lost_deals: lostDeals.length,
          open_deals: openDeals.length,
          total_revenue: wonDeals.reduce((sum, d) => sum + Number(d.amount), 0),
          pipeline_value: openDeals.reduce((sum, d) => sum + Number(d.amount), 0),
          win_rate: deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0,
          avg_deal_size: wonDeals.length > 0 
            ? Math.round(wonDeals.reduce((sum, d) => sum + Number(d.amount), 0) / wonDeals.length)
            : 0
        },
        activity_metrics: {
          total_activities: activities.length,
          calls: activities.filter(a => a.type === 'call').length,
          emails: activities.filter(a => a.type === 'email').length,
          meetings: activities.filter(a => a.type === 'meeting').length
        }
      }
      
      if (includeDetails) {
        report['top_deals'] = openDeals
          .sort((a, b) => Number(b.amount) - Number(a.amount))
          .slice(0, 5)
          .map(d => ({
            name: d.name,
            amount: d.amount,
            stage: d.stage,
            close_date: d.closeDate
          }))
        
        report['recent_wins'] = wonDeals
          .slice(-5)
          .map(d => ({
            name: d.name,
            amount: d.amount,
            close_date: d.closeDate
          }))
      }
      
      // Save report
      const outputDir = path.join(process.cwd(), 'data', 'reports')
      await fs.mkdir(outputDir, { recursive: true })
      const filename = `sales-report-${period}-${Date.now()}.json`
      await fs.writeFile(
        path.join(outputDir, filename),
        JSON.stringify(report, null, 2)
      )
      
      return JSON.stringify({
        success: true,
        message: `${period} sales report generated`,
        filename,
        path: `/data/reports/${filename}`,
        summary: report.summary
      })
    }
  })

  // Export Data Tool
  const exportData = new DynamicStructuredTool({
    name: 'export_data',
    description: 'Export CRM data to CSV or JSON format',
    schema: z.object({
      dataType: z.enum(['deals', 'contacts', 'accounts', 'activities']),
      format: z.enum(['csv', 'json']).default('csv'),
      filter: z.string().optional().describe('Optional filter criteria')
    }),
    func: async ({ dataType, format, filter }) => {
      let data: any[] = []
      let filename = ''
      
      switch (dataType) {
        case 'deals':
          data = await dealRepo.find({ where: { tenant: { id: tenantId } } })
          filename = `deals-export-${Date.now()}.${format}`
          break
        case 'contacts':
          data = await contactRepo.find({ where: { tenant: { id: tenantId } } })
          filename = `contacts-export-${Date.now()}.${format}`
          break
        case 'accounts':
          data = await accountRepo.find({ where: { tenant: { id: tenantId } } })
          filename = `accounts-export-${Date.now()}.${format}`
          break
        case 'activities':
          data = await activityRepo.find({ 
            where: { tenant: { id: tenantId } },
            order: { occurredAt: 'DESC' },
            take: 1000
          })
          filename = `activities-export-${Date.now()}.${format}`
          break
      }
      
      // Apply filter if provided
      if (filter) {
        // Simple filter implementation - in production, use proper query builder
        const filterLower = filter.toLowerCase()
        data = data.filter(item => 
          JSON.stringify(item).toLowerCase().includes(filterLower)
        )
      }
      
      // Export data
      const outputDir = path.join(process.cwd(), 'data', 'exports')
      await fs.mkdir(outputDir, { recursive: true })
      const filepath = path.join(outputDir, filename)
      
      if (format === 'csv') {
        // Simple CSV generation
        if (data.length > 0) {
          const headers = Object.keys(data[0]).filter(k => k !== 'tenant')
          const csvContent = [
            headers.join(','),
            ...data.map(item => 
              headers.map(h => {
                const value = item[h]
                return typeof value === 'string' && value.includes(',') 
                  ? `"${value}"` 
                  : value
              }).join(',')
            )
          ].join('\n')
          
          await fs.writeFile(filepath, csvContent)
        }
      } else {
        await fs.writeFile(filepath, JSON.stringify(data, null, 2))
      }
      
      return JSON.stringify({
        success: true,
        message: `Exported ${data.length} ${dataType} to ${format}`,
        filename,
        path: `/data/exports/${filename}`,
        recordCount: data.length
      })
    }
  })

  // Calculate Forecast Tool
  const calculateForecast = new DynamicTool({
    name: 'calculate_forecast',
    description: 'Calculate revenue forecast based on current pipeline and historical win rate',
    func: async () => {
      const deals = await dealRepo.find({ where: { tenant: { id: tenantId } } })
      
      const wonDeals = deals.filter(d => d.stage?.toLowerCase().includes('won'))
      const openDeals = deals.filter(d => 
        !d.stage?.toLowerCase().includes('closed') && 
        !d.stage?.toLowerCase().includes('won') && 
        !d.stage?.toLowerCase().includes('lost')
      )
      
      const totalRevenue = wonDeals.reduce((sum, d) => sum + Number(d.amount), 0)
      const pipelineValue = openDeals.reduce((sum, d) => sum + Number(d.amount), 0)
      const winRate = deals.length > 0 ? wonDeals.length / deals.length : 0
      
      // Calculate forecast by stage probability
      const stageProb = {
        'qualification': 0.1,
        'qualified': 0.2,
        'proposal': 0.4,
        'negotiation': 0.6,
        'verbal commit': 0.8
      }
      
      let weightedPipeline = 0
      openDeals.forEach(deal => {
        const stage = deal.stage?.toLowerCase() || ''
        let probability = 0.25 // default
        
        for (const [key, prob] of Object.entries(stageProb)) {
          if (stage.includes(key)) {
            probability = prob
            break
          }
        }
        
        weightedPipeline += Number(deal.amount) * probability
      })
      
      return JSON.stringify({
        current_revenue: totalRevenue,
        pipeline_value: pipelineValue,
        historical_win_rate: Math.round(winRate * 100),
        forecast: {
          conservative: totalRevenue + (weightedPipeline * 0.7),
          likely: totalRevenue + weightedPipeline,
          optimistic: totalRevenue + (pipelineValue * winRate),
          weighted_pipeline: weightedPipeline
        },
        breakdown: {
          closed_won: totalRevenue,
          pipeline_weighted: weightedPipeline,
          pipeline_total: pipelineValue,
          deal_count: openDeals.length
        }
      })
    }
  })

  // Analyze Performance Tool
  const analyzePerformance = new DynamicTool({
    name: 'analyze_performance',
    description: 'Analyze sales and business performance with insights and recommendations',
    func: async () => {
      const [deals, activities, accounts, contacts] = await Promise.all([
        dealRepo.find({ where: { tenant: { id: tenantId } } }),
        activityRepo.find({ 
          where: { tenant: { id: tenantId } },
          order: { occurredAt: 'DESC' },
          take: 500
        }),
        accountRepo.find({ where: { tenant: { id: tenantId } } }),
        contactRepo.find({ where: { tenant: { id: tenantId } } })
      ])
      
      const wonDeals = deals.filter(d => d.stage?.toLowerCase().includes('won'))
      const lostDeals = deals.filter(d => d.stage?.toLowerCase().includes('lost'))
      const openDeals = deals.filter(d => 
        !d.stage?.toLowerCase().includes('closed') && 
        !d.stage?.toLowerCase().includes('won') && 
        !d.stage?.toLowerCase().includes('lost')
      )
      
      // Calculate metrics
      const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0
      const avgDealSize = wonDeals.length > 0 
        ? wonDeals.reduce((sum, d) => sum + Number(d.amount), 0) / wonDeals.length
        : 0
      const activityPerDeal = deals.length > 0 ? activities.length / deals.length : 0
      
      // Generate insights
      const insights = []
      const recommendations = []
      
      if (winRate < 20) {
        insights.push('Low win rate detected - below 20%')
        recommendations.push('Review qualification criteria and improve discovery process')
      }
      
      if (activityPerDeal < 5) {
        insights.push('Low activity level per deal')
        recommendations.push('Increase customer engagement - aim for 8-10 activities per deal')
      }
      
      if (openDeals.length < wonDeals.length * 3) {
        insights.push('Pipeline coverage is low')
        recommendations.push('Focus on pipeline generation - need 3x coverage ratio')
      }
      
      const stalledDeals = openDeals.filter(d => {
        if (d.updatedAt) {
          const daysSinceUpdate = Math.floor(
            (new Date().getTime() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
          )
          return daysSinceUpdate > 30
        }
        return false
      })
      
      if (stalledDeals.length > 0) {
        insights.push(`${stalledDeals.length} deals have been stalled for over 30 days`)
        recommendations.push('Re-engage stalled opportunities or remove from pipeline')
      }
      
      return JSON.stringify({
        metrics: {
          win_rate: Math.round(winRate),
          avg_deal_size: Math.round(avgDealSize),
          total_accounts: accounts.length,
          total_contacts: contacts.length,
          activity_per_deal: Math.round(activityPerDeal * 10) / 10,
          pipeline_coverage: openDeals.length / Math.max(wonDeals.length, 1)
        },
        deal_analysis: {
          total: deals.length,
          won: wonDeals.length,
          lost: lostDeals.length,
          open: openDeals.length,
          stalled: stalledDeals.length
        },
        insights,
        recommendations,
        health_score: winRate > 25 && activityPerDeal > 5 ? 'Good' : winRate > 15 ? 'Fair' : 'Needs Improvement'
      })
    }
  })

  return [
    generateBoardPresentation,
    generateSalesReport,
    exportData,
    calculateForecast,
    analyzePerformance
  ]
}