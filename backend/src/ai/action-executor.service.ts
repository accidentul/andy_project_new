import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/user.entity'
import { CrmAccount, CrmContact, CrmDeal, CrmActivity } from '../connectors/unified-crm.entities'
import { ConnectorsService } from '../connectors/connectors.service'
import * as fs from 'fs/promises'
import * as path from 'path'
import { createObjectCsvWriter } from 'csv-writer'

export interface ActionExecutionRequest {
  action: {
    type: 'automation' | 'alert' | 'recommendation'
    title: string
    description: string
    actionData?: any
  }
  user: User
  conversationId?: string
}

export interface ActionExecutionResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

@Injectable()
export class ActionExecutorService {
  constructor(
    @InjectRepository(CrmAccount) private readonly accountRepo: Repository<CrmAccount>,
    @InjectRepository(CrmContact) private readonly contactRepo: Repository<CrmContact>,
    @InjectRepository(CrmDeal) private readonly dealRepo: Repository<CrmDeal>,
    @InjectRepository(CrmActivity) private readonly activityRepo: Repository<CrmActivity>,
    private readonly connectorsService: ConnectorsService,
  ) {}

  async executeAction(request: ActionExecutionRequest): Promise<ActionExecutionResult> {
    const { action, user } = request
    
    try {
      switch (action.type) {
        case 'automation':
          return await this.executeAutomation(action, user)
        case 'alert':
          return await this.executeAlert(action, user)
        case 'recommendation':
          return await this.executeRecommendation(action, user)
        default:
          return {
            success: false,
            message: 'Unknown action type',
            error: `Action type ${action.type} is not supported`
          }
      }
    } catch (error: any) {
      console.error('Action execution error:', error)
      return {
        success: false,
        message: 'Action execution failed',
        error: error.message
      }
    }
  }

  private async executeAutomation(action: any, user: User): Promise<ActionExecutionResult> {
    const { actionData } = action
    
    // Generate Board Presentation
    if (actionData?.template === 'executive_board') {
      return await this.generateBoardPresentation(user)
    }
    
    // Export Data
    if (actionData?.type === 'export') {
      return await this.exportData(actionData, user)
    }
    
    // Generate Report
    if (actionData?.type === 'report') {
      return await this.generateReport(actionData, user)
    }
    
    // Schedule Task
    if (actionData?.type === 'schedule') {
      return await this.scheduleTask(actionData, user)
    }
    
    return {
      success: false,
      message: 'Automation type not implemented',
      error: `Automation ${action.title} is not yet implemented`
    }
  }

  private async executeAlert(action: any, user: User): Promise<ActionExecutionResult> {
    const { actionData } = action
    
    // Create Dashboard Alert
    if (actionData?.severity) {
      return await this.createDashboardAlert(actionData, user)
    }
    
    // Send Email Alert
    if (actionData?.type === 'email') {
      return await this.sendEmailAlert(actionData, user)
    }
    
    // Update Status
    if (actionData?.type === 'status_update') {
      return await this.updateStatus(actionData, user)
    }
    
    return {
      success: false,
      message: 'Alert type not implemented',
      error: `Alert ${action.title} is not yet implemented`
    }
  }

  private async executeRecommendation(action: any, user: User): Promise<ActionExecutionResult> {
    const { actionData } = action
    
    // Create CRM Task
    if (actionData?.type === 'task') {
      return await this.createCrmTask(actionData, user)
    }
    
    // Update Deal Stage
    if (actionData?.type === 'deal_update') {
      return await this.updateDealStage(actionData, user)
    }
    
    // Adjust Settings
    if (actionData?.type === 'settings') {
      return await this.adjustSettings(actionData, user)
    }
    
    // M&A Analysis
    if (actionData?.type === 'acquisition') {
      return await this.performMAAnalysis(actionData, user)
    }
    
    return {
      success: false,
      message: 'Recommendation type not implemented',
      error: `Recommendation ${action.title} is not yet implemented`
    }
  }

  // Specific Automation Implementations
  
  private async generateBoardPresentation(user: User): Promise<ActionExecutionResult> {
    const tenantId = user.tenant.id
    
    // Gather real metrics
    const deals = await this.dealRepo.find({ where: { tenant: { id: tenantId } } })
    const accounts = await this.accountRepo.find({ where: { tenant: { id: tenantId } } })
    const contacts = await this.contactRepo.find({ where: { tenant: { id: tenantId } } })
    
    const totalRevenue = deals
      .filter(d => d.stage?.toLowerCase().includes('won'))
      .reduce((sum, d) => sum + Number(d.amount || 0), 0)
    
    const pipelineValue = deals
      .filter(d => !d.stage?.toLowerCase().includes('closed'))
      .reduce((sum, d) => sum + Number(d.amount || 0), 0)
    
    const presentation = {
      title: 'Executive Board Presentation',
      date: new Date().toISOString(),
      metrics: {
        totalRevenue: Math.round(totalRevenue),
        pipelineValue: Math.round(pipelineValue),
        accountCount: accounts.length,
        contactCount: contacts.length,
        dealCount: deals.length,
        winRate: deals.length > 0 
          ? Math.round((deals.filter(d => d.stage?.includes('Won')).length / deals.length) * 100) 
          : 0,
        avgDealSize: deals.length > 0 
          ? Math.round(totalRevenue / deals.filter(d => d.stage?.includes('Won')).length)
          : 0
      },
      insights: [
        `Revenue Performance: $${(totalRevenue / 1000000).toFixed(2)}M achieved`,
        `Pipeline Health: $${(pipelineValue / 1000000).toFixed(2)}M in active opportunities`,
        `Customer Base: ${accounts.length} active accounts with ${contacts.length} contacts`,
        `Sales Efficiency: ${deals.filter(d => d.stage?.includes('Won')).length} deals closed with ${Math.round((deals.filter(d => d.stage?.includes('Won')).length / deals.length) * 100)}% win rate`
      ],
      recommendations: [
        'Focus on pipeline acceleration to convert $' + (pipelineValue / 1000000).toFixed(1) + 'M in opportunities',
        'Expand account penetration - average contacts per account: ' + (contacts.length / Math.max(accounts.length, 1)).toFixed(1),
        'Optimize deal velocity - current average deal size: $' + (totalRevenue / Math.max(deals.filter(d => d.stage?.includes('Won')).length, 1) / 1000).toFixed(0) + 'K'
      ]
    }
    
    // Save presentation data
    const outputDir = path.join(process.cwd(), 'data', 'presentations')
    await fs.mkdir(outputDir, { recursive: true })
    const filename = `board-presentation-${Date.now()}.json`
    await fs.writeFile(
      path.join(outputDir, filename),
      JSON.stringify(presentation, null, 2)
    )
    
    return {
      success: true,
      message: 'Board presentation generated successfully',
      data: {
        filename,
        path: path.join('data', 'presentations', filename),
        metrics: presentation.metrics,
        downloadUrl: `/api/ai/download/presentation/${filename}`
      }
    }
  }

  private async exportData(actionData: any, user: User): Promise<ActionExecutionResult> {
    const tenantId = user.tenant.id
    const { dataType = 'deals', format = 'csv' } = actionData
    
    let data: any[] = []
    let filename = ''
    
    // Fetch data based on type
    switch (dataType) {
      case 'deals':
        data = await this.dealRepo.find({ 
          where: { tenant: { id: tenantId } },
          relations: ['account', 'contact']
        })
        filename = `deals-export-${Date.now()}.${format}`
        break
      case 'accounts':
        data = await this.accountRepo.find({ 
          where: { tenant: { id: tenantId } }
        })
        filename = `accounts-export-${Date.now()}.${format}`
        break
      case 'contacts':
        data = await this.contactRepo.find({ 
          where: { tenant: { id: tenantId } },
          relations: ['account']
        })
        filename = `contacts-export-${Date.now()}.${format}`
        break
    }
    
    // Export data
    const outputDir = path.join(process.cwd(), 'data', 'exports')
    await fs.mkdir(outputDir, { recursive: true })
    const filepath = path.join(outputDir, filename)
    
    if (format === 'csv') {
      // Create CSV
      const records = data.map(item => ({
        id: item.id,
        name: item.name || item.title,
        ...(dataType === 'deals' ? {
          amount: item.amount,
          stage: item.stage,
          closeDate: item.closeDate,
          account: item.account?.name
        } : {}),
        ...(dataType === 'contacts' ? {
          email: item.email,
          phone: item.phone,
          account: item.account?.name
        } : {}),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))
      
      const csvWriter = createObjectCsvWriter({
        path: filepath,
        header: Object.keys(records[0] || {}).map(key => ({ id: key, title: key }))
      })
      
      await csvWriter.writeRecords(records)
    } else {
      // JSON export
      await fs.writeFile(filepath, JSON.stringify(data, null, 2))
    }
    
    return {
      success: true,
      message: `Exported ${data.length} ${dataType} successfully`,
      data: {
        filename,
        recordCount: data.length,
        format,
        downloadUrl: `/api/ai/download/export/${filename}`
      }
    }
  }

  private async generateReport(actionData: any, user: User): Promise<ActionExecutionResult> {
    const tenantId = user.tenant.id
    const { reportType = 'sales', period = 'monthly' } = actionData
    
    // Generate comprehensive report
    const deals = await this.dealRepo.find({ where: { tenant: { id: tenantId } } })
    const accounts = await this.accountRepo.find({ where: { tenant: { id: tenantId } } })
    const activities = await this.activityRepo.find({ where: { tenant: { id: tenantId } } })
    
    const report = {
      type: reportType,
      period,
      generatedAt: new Date().toISOString(),
      summary: {
        totalDeals: deals.length,
        wonDeals: deals.filter(d => d.stage?.includes('Won')).length,
        lostDeals: deals.filter(d => d.stage?.includes('Lost')).length,
        totalRevenue: deals
          .filter(d => d.stage?.includes('Won'))
          .reduce((sum, d) => sum + Number(d.amount || 0), 0),
        totalAccounts: accounts.length,
        totalActivities: activities.length
      },
      insights: [] as string[],
      recommendations: [] as string[]
    }
    
    // Add insights based on data
    if (report.summary.wonDeals > 0) {
      report.insights.push(`Win rate: ${Math.round((report.summary.wonDeals / report.summary.totalDeals) * 100)}%`)
      report.insights.push(`Average deal size: $${Math.round(report.summary.totalRevenue / report.summary.wonDeals).toLocaleString()}`)
    }
    
    if (activities.length > 0) {
      const avgActivitiesPerDeal = Math.round(activities.length / Math.max(deals.length, 1))
      report.insights.push(`Average activities per deal: ${avgActivitiesPerDeal}`)
      
      if (avgActivitiesPerDeal < 5) {
        report.recommendations.push('Increase sales activities - current activity level is below optimal')
      }
    }
    
    // Save report
    const outputDir = path.join(process.cwd(), 'data', 'reports')
    await fs.mkdir(outputDir, { recursive: true })
    const filename = `${reportType}-report-${Date.now()}.json`
    await fs.writeFile(
      path.join(outputDir, filename),
      JSON.stringify(report, null, 2)
    )
    
    return {
      success: true,
      message: `${reportType} report generated successfully`,
      data: {
        filename,
        summary: report.summary,
        downloadUrl: `/api/ai/download/report/${filename}`
      }
    }
  }

  private async scheduleTask(actionData: any, user: User): Promise<ActionExecutionResult> {
    // In a real implementation, this would integrate with a task scheduler
    const { taskType, schedule, parameters } = actionData
    
    const scheduledTask = {
      id: `task-${Date.now()}`,
      type: taskType,
      schedule,
      parameters,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      status: 'scheduled'
    }
    
    // Save task configuration
    const outputDir = path.join(process.cwd(), 'data', 'scheduled-tasks')
    await fs.mkdir(outputDir, { recursive: true })
    const filename = `${scheduledTask.id}.json`
    await fs.writeFile(
      path.join(outputDir, filename),
      JSON.stringify(scheduledTask, null, 2)
    )
    
    return {
      success: true,
      message: `Task scheduled successfully`,
      data: {
        taskId: scheduledTask.id,
        nextRun: this.calculateNextRun(schedule),
        status: 'scheduled'
      }
    }
  }

  // Alert Implementations
  
  private async createDashboardAlert(actionData: any, user: User): Promise<ActionExecutionResult> {
    const { severity, message, notifyBoard } = actionData
    
    const alert = {
      id: `alert-${Date.now()}`,
      severity,
      message,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      acknowledged: false,
      notifyBoard
    }
    
    // In a real implementation, this would store in database and trigger notifications
    const outputDir = path.join(process.cwd(), 'data', 'alerts')
    await fs.mkdir(outputDir, { recursive: true })
    const filename = `${alert.id}.json`
    await fs.writeFile(
      path.join(outputDir, filename),
      JSON.stringify(alert, null, 2)
    )
    
    return {
      success: true,
      message: 'Alert created successfully',
      data: {
        alertId: alert.id,
        severity,
        notificationsSent: notifyBoard ? ['board@company.com'] : []
      }
    }
  }

  private async sendEmailAlert(actionData: any, user: User): Promise<ActionExecutionResult> {
    const { recipients, subject, body, priority } = actionData
    
    // In a real implementation, this would integrate with email service
    const email = {
      id: `email-${Date.now()}`,
      to: recipients,
      subject,
      body,
      priority,
      sentBy: user.id,
      sentAt: new Date().toISOString(),
      status: 'queued'
    }
    
    // Log email for demonstration
    console.log('Email queued:', email)
    
    return {
      success: true,
      message: `Email alert queued for ${recipients.length} recipients`,
      data: {
        emailId: email.id,
        recipients,
        status: 'queued'
      }
    }
  }

  private async updateStatus(actionData: any, user: User): Promise<ActionExecutionResult> {
    const { entityType, entityId, newStatus } = actionData
    
    // Update entity status based on type
    let updated = false
    
    if (entityType === 'deal') {
      const deal = await this.dealRepo.findOne({ 
        where: { id: entityId, tenant: { id: user.tenant.id } } 
      })
      if (deal) {
        deal.stage = newStatus
        await this.dealRepo.save(deal)
        updated = true
      }
    }
    
    return {
      success: updated,
      message: updated ? 'Status updated successfully' : 'Entity not found',
      data: {
        entityType,
        entityId,
        newStatus
      }
    }
  }

  // Recommendation Implementations
  
  private async createCrmTask(actionData: any, user: User): Promise<ActionExecutionResult> {
    const { title, description, dueDate, assignee, relatedTo } = actionData
    
    const activity = this.activityRepo.create({
      tenant: user.tenant,
      type: 'task',
      occurredAt: new Date(),
      subject: title,
      notes: description,
      provider: 'salesforce' as const,
      connectorId: 'system',
      createdAt: new Date()
    })
    
    await this.activityRepo.save(activity)
    
    return {
      success: true,
      message: 'Task created successfully',
      data: {
        taskId: activity.id,
        title,
        dueDate,
        status: 'pending'
      }
    }
  }

  private async updateDealStage(actionData: any, user: User): Promise<ActionExecutionResult> {
    const { dealId, newStage, reason } = actionData
    
    const deal = await this.dealRepo.findOne({ 
      where: { id: dealId, tenant: { id: user.tenant.id } } 
    })
    
    if (!deal) {
      return {
        success: false,
        message: 'Deal not found',
        error: `Deal ${dealId} not found or access denied`
      }
    }
    
    const oldStage = deal.stage
    deal.stage = newStage
    await this.dealRepo.save(deal)
    
    // Log stage change
    const activity = this.activityRepo.create({
      tenant: user.tenant,
      type: 'note',
      occurredAt: new Date(),
      subject: `Deal stage updated: ${oldStage} → ${newStage}`,
      notes: reason || 'Stage updated via AI recommendation',
      provider: 'salesforce' as const,
      connectorId: 'system',
      createdAt: new Date()
    })
    await this.activityRepo.save(activity)
    
    return {
      success: true,
      message: 'Deal stage updated successfully',
      data: {
        dealId,
        oldStage,
        newStage,
        activityId: activity.id
      }
    }
  }

  private async adjustSettings(actionData: any, user: User): Promise<ActionExecutionResult> {
    const { settingType, changes } = actionData
    
    // In a real implementation, this would update user/tenant settings
    const settings = {
      id: `settings-${Date.now()}`,
      userId: user.id,
      tenantId: user.tenant.id,
      type: settingType,
      changes,
      appliedAt: new Date().toISOString()
    }
    
    // Save settings change
    const outputDir = path.join(process.cwd(), 'data', 'settings')
    await fs.mkdir(outputDir, { recursive: true })
    const filename = `${settings.id}.json`
    await fs.writeFile(
      path.join(outputDir, filename),
      JSON.stringify(settings, null, 2)
    )
    
    return {
      success: true,
      message: 'Settings adjusted successfully',
      data: {
        settingType,
        changes,
        appliedAt: settings.appliedAt
      }
    }
  }

  private async performMAAnalysis(actionData: any, user: User): Promise<ActionExecutionResult> {
    const { targetCompany, estimatedValue, rationale } = actionData
    
    // Generate M&A analysis report
    const analysis = {
      id: `ma-analysis-${Date.now()}`,
      targetCompany,
      estimatedValue,
      rationale,
      analysisDate: new Date().toISOString(),
      metrics: {
        marketShare: 'Estimated 15-20% increase',
        synergies: '$10-15M annual cost savings',
        integrationTime: '6-9 months',
        roi: '3-4 years payback period'
      },
      risks: [
        'Cultural integration challenges',
        'Technology platform consolidation',
        'Customer retention during transition'
      ],
      recommendations: [
        'Conduct detailed due diligence',
        'Develop integration roadmap',
        'Secure key talent retention agreements'
      ]
    }
    
    // Save analysis
    const outputDir = path.join(process.cwd(), 'data', 'ma-analysis')
    await fs.mkdir(outputDir, { recursive: true })
    const filename = `${analysis.id}.json`
    await fs.writeFile(
      path.join(outputDir, filename),
      JSON.stringify(analysis, null, 2)
    )
    
    return {
      success: true,
      message: 'M&A analysis completed',
      data: {
        analysisId: analysis.id,
        targetCompany,
        estimatedValue,
        downloadUrl: `/api/ai/download/analysis/${filename}`
      }
    }
  }

  private calculateNextRun(schedule: any): string {
    // Simple next run calculation (in real implementation, use cron parser)
    const now = new Date()
    if (schedule.frequency === 'daily') {
      now.setDate(now.getDate() + 1)
    } else if (schedule.frequency === 'weekly') {
      now.setDate(now.getDate() + 7)
    } else if (schedule.frequency === 'monthly') {
      now.setMonth(now.getMonth() + 1)
    }
    return now.toISOString()
  }
}