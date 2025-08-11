import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import Redis from 'ioredis'
import { AgentFactory } from './agents/agent.factory'
import { AgentContext, AgentResponse } from './agents/base.agent'
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages'
import { User } from '../users/user.entity'
import { CrmAccount, CrmActivity, CrmContact, CrmDeal } from '../connectors/unified-crm.entities'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { Document } from 'langchain/document'

@Injectable()
export class EnhancedAiService {
  private redis: Redis | null = null
  private agentFactory: AgentFactory

  constructor(
    @InjectRepository(CrmAccount) private readonly accountRepo: Repository<CrmAccount>,
    @InjectRepository(CrmContact) private readonly contactRepo: Repository<CrmContact>,
    @InjectRepository(CrmDeal) private readonly dealRepo: Repository<CrmDeal>,
    @InjectRepository(CrmActivity) private readonly activityRepo: Repository<CrmActivity>,
  ) {
    // Make Redis optional for testing
    if (process.env.REDIS_HOST || process.env.NODE_ENV !== 'test') {
      try {
        this.redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          retryStrategy: () => null, // Don't retry in tests
        })
        
        this.redis.on('error', (err) => {
          console.warn('Redis connection error (non-fatal):', err.message)
        })
      } catch (error) {
        console.warn('Redis initialization failed (using in-memory fallback)')
        this.redis = null as any
      }
    }
    
    this.agentFactory = new AgentFactory()
  }

  async processUserQuery(
    user: User,
    query: string,
    conversationId?: string,
  ): Promise<AgentResponse> {
    // Get or create conversation
    const convId = conversationId || `conv:${user.id}:${Date.now()}`
    
    // Retrieve conversation history from Redis
    const conversation = await this.getConversationHistory(convId)
    
    // Get appropriate agent for user
    const agent = this.agentFactory.getAgentForUser(user)
    
    // Gather business context based on user role
    const businessData = await this.gatherBusinessContext(user)
    
    // Build agent context
    const context: AgentContext = {
      user,
      tenantId: user.tenant.id,
      conversation,
      businessData,
    }
    
    // Process query with agent
    const response = await agent.processQuery(query, context)
    
    // Store conversation in Redis
    await this.saveConversation(convId, query, response.content)
    
    // Enhance response with real-time data if needed
    const enhancedResponse = await this.enhanceWithRealTimeData(response, user)
    
    return enhancedResponse
  }

  private async getConversationHistory(conversationId: string): Promise<BaseMessage[]> {
    if (!this.redis) return [] // Return empty history if Redis not available
    
    try {
      const history = await this.redis.get(conversationId)
      if (!history) return []
      
      const messages = JSON.parse(history)
      return messages.map((msg: any) => {
        if (msg.role === 'user') {
          return new HumanMessage(msg.content)
        } else {
          return new AIMessage(msg.content)
        }
      })
    } catch (error) {
      console.warn('Failed to get conversation history:', error)
      return []
    }
  }

  private async saveConversation(
    conversationId: string,
    userMessage: string,
    aiResponse: string,
  ): Promise<void> {
    if (!this.redis) return // Skip if Redis not available
    
    try {
      const history = await this.redis.get(conversationId)
      const messages = history ? JSON.parse(history) : []
      
      messages.push(
        { role: 'user', content: userMessage, timestamp: new Date() },
        { role: 'assistant', content: aiResponse, timestamp: new Date() },
      )
      
      // Keep last 20 messages
      const recentMessages = messages.slice(-20)
      
      // Store with 24 hour expiry
      await this.redis.setex(conversationId, 86400, JSON.stringify(recentMessages))
    } catch (error) {
      console.warn('Failed to save conversation:', error)
    }
  }

  private async gatherBusinessContext(user: User): Promise<any> {
    const tenantId = user.tenant.id
    const roleTitle = (user as any).roleTitle || user.role?.name || 'User'
    const department = (user as any).department || 'General'
    
    // Fetch all relevant data (no relations in current schema)
    const [deals, accounts, contacts, activities] = await Promise.all([
      this.dealRepo.find({ 
        where: { tenant: { id: tenantId } }
      }),
      this.accountRepo.find({ 
        where: { tenant: { id: tenantId } }
      }),
      this.contactRepo.find({ 
        where: { tenant: { id: tenantId } }
      }),
      this.activityRepo.find({ 
        where: { tenant: { id: tenantId } },
        order: { createdAt: 'DESC' },
        take: 100
      })
    ])
    
    // Calculate common metrics
    const wonDeals = deals.filter(d => d.stage?.toLowerCase().includes('won'))
    const lostDeals = deals.filter(d => d.stage?.toLowerCase().includes('lost'))
    const openDeals = deals.filter(d => 
      !d.stage?.toLowerCase().includes('closed') && 
      !d.stage?.toLowerCase().includes('won') && 
      !d.stage?.toLowerCase().includes('lost')
    )
    
    const totalRevenue = wonDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0)
    const pipelineValue = openDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0)
    const avgDealSize = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0
    const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0
    
    // Calculate time-based metrics
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    
    const recentWonDeals = wonDeals.filter(d => 
      d.closeDate && new Date(d.closeDate) > thirtyDaysAgo
    )
    const recentActivities = activities.filter(a => 
      a.createdAt && new Date(a.createdAt) > thirtyDaysAgo
    )
    
    // Calculate velocity metrics
    const dealVelocity = wonDeals.length > 0 ? 
      wonDeals.reduce((sum, d) => {
        if (d.createdAt && d.closeDate) {
          const days = Math.floor((new Date(d.closeDate).getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          return sum + days
        }
        return sum
      }, 0) / wonDeals.length : 0
    
    const context: any = {
      userRole: roleTitle,
      department,
      dataFreshness: new Date().toISOString(),
      metrics: {
        totalRevenue,
        pipelineValue,
        dealCount: deals.length,
        accountCount: accounts.length,
        contactCount: contacts.length,
        activityCount: activities.length,
        avgDealSize,
        winRate: Math.round(winRate),
        dealVelocity: Math.round(dealVelocity)
      }
    }
    
    // Add role-specific detailed context
    if (roleTitle.toLowerCase().includes('ceo') || roleTitle.toLowerCase().includes('executive')) {
      // CEO gets comprehensive company metrics
      context.executive = {
        revenue: {
          total: totalRevenue,
          monthly: recentWonDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0),
          growth: this.calculateGrowthRate(wonDeals, thirtyDaysAgo, ninetyDaysAgo),
          forecast: pipelineValue * (winRate / 100) * 0.8 // Conservative forecast
        },
        performance: {
          dealsClosed: wonDeals.length,
          dealsLost: lostDeals.length,
          winRate: Math.round(winRate),
          avgDealCycle: Math.round(dealVelocity),
          customerRetention: this.calculateRetentionRate(accounts, activities)
        },
        opportunities: {
          pipeline: pipelineValue,
          qualifiedLeads: openDeals.filter(d => d.stage?.includes('Qualified')).length,
          topDeals: openDeals
            .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
            .slice(0, 5)
            .map(d => ({ name: d.name, amount: d.amount, stage: d.stage }))
        },
        risks: this.identifyRisks(deals, activities, accounts)
      }
    } else if (department.toLowerCase().includes('sales')) {
      // Sales gets detailed pipeline metrics
      context.sales = {
        pipeline: {
          total: pipelineValue,
          byStage: this.groupDealsByStage(openDeals),
          velocity: dealVelocity,
          coverage: pipelineValue / (totalRevenue / 12) // Pipeline coverage ratio
        },
        performance: {
          quota: totalRevenue,
          achieved: recentWonDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0),
          winRate: Math.round(winRate),
          avgDealSize: Math.round(avgDealSize)
        },
        activities: {
          total: recentActivities.length,
          byType: this.groupActivitiesByType(recentActivities),
          perDeal: activities.length / Math.max(deals.length, 1)
        },
        topOpportunities: openDeals
          .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
          .slice(0, 10)
          .map(d => ({
            id: d.id,
            name: d.name,
            amount: d.amount,
            stage: d.stage,
            account: null, // No account relation in current schema
            daysInStage: d.updatedAt ? 
              Math.floor((now.getTime() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
          }))
      }
    } else if (department.toLowerCase().includes('marketing')) {
      // Marketing gets lead and campaign metrics
      const newContacts = contacts.filter(c => 
        c.createdAt && new Date(c.createdAt) > thirtyDaysAgo
      )
      
      context.marketing = {
        leads: {
          total: contacts.length,
          new: newContacts.length,
          bySource: this.groupContactsBySource(contacts),
          conversionRate: (wonDeals.length / Math.max(contacts.length, 1)) * 100
        },
        engagement: {
          activities: recentActivities.length,
          emailsSent: recentActivities.filter(a => a.type === 'email').length,
          callsMade: recentActivities.filter(a => a.type === 'call').length,
          meetingsHeld: recentActivities.filter(a => a.type === 'meeting').length
        },
        pipeline: {
          influenced: openDeals.length, // All deals are influenced
          value: openDeals
            // All deals counted as influenced
            .reduce((sum, d) => sum + Number(d.amount || 0), 0)
        },
        topAccounts: accounts
          .map(a => ({
            name: a.name,
            contacts: 0, // No account relation in current schema
            deals: 0, // No account relation in current schema
            revenue: wonDeals
              .filter(d => false) // No account relation in current schema
              .reduce((sum, d) => sum + Number(d.amount || 0), 0)
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
      }
    } else {
      // Default context for other roles
      context.general = {
        summary: {
          revenue: totalRevenue,
          pipeline: pipelineValue,
          accounts: accounts.length,
          contacts: contacts.length,
          activities: activities.length
        },
        trends: {
          dealsWon: recentWonDeals.length,
          newContacts: contacts.filter(c => 
            c.createdAt && new Date(c.createdAt) > thirtyDaysAgo
          ).length,
          recentActivities: recentActivities.length
        }
      }
    }
    
    // Add real metrics summary for AI to reference
    context.currentMetrics = {
      totalRevenue,
      pipelineValue,
      dealCount: deals.length,
      contactCount: contacts.length,
      avgDealSize: Math.round(avgDealSize)
    }
    
    return context
  }
  
  private calculateGrowthRate(deals: any[], recent: Date, previous: Date): number {
    const recentRevenue = deals
      .filter(d => d.closeDate && new Date(d.closeDate) > recent)
      .reduce((sum, d) => sum + Number(d.amount || 0), 0)
    
    const previousRevenue = deals
      .filter(d => d.closeDate && new Date(d.closeDate) > previous && new Date(d.closeDate) <= recent)
      .reduce((sum, d) => sum + Number(d.amount || 0), 0)
    
    if (previousRevenue === 0) return 0
    return Math.round(((recentRevenue - previousRevenue) / previousRevenue) * 100)
  }
  
  private calculateRetentionRate(accounts: any[], activities: any[]): number {
    // Simple retention: accounts with recent activity (assuming all accounts active)
    if (accounts.length === 0) return 0
    // For now, assume 80% retention as we don't have account-activity relations
    return 80
  }
  
  private identifyRisks(deals: any[], activities: any[], accounts: any[]): string[] {
    const risks = []
    
    // Check for stalled deals
    const stalledDeals = deals.filter(d => {
      if (d.updatedAt && !d.stage?.includes('Closed')) {
        const daysSinceUpdate = Math.floor(
          (new Date().getTime() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysSinceUpdate > 30
      }
      return false
    })
    
    if (stalledDeals.length > 0) {
      risks.push(`${stalledDeals.length} deals have been stalled for over 30 days`)
    }
    
    // Check for low activity
    const recentActivities = activities.filter(a => 
      a.createdAt && new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )
    
    if (recentActivities.length < deals.length * 2) {
      risks.push('Low sales activity relative to pipeline size')
    }
    
    // Check for concentration risk (simplified without account relations)
    const totalRevenue = deals
      .filter(d => d.stage?.includes('Won'))
      .reduce((sum, d) => sum + Number(d.amount || 0), 0)
    
    // Check if too few accounts relative to revenue
    if (accounts.length > 0 && totalRevenue / accounts.length > 100000) {
      risks.push('Potential revenue concentration - high average revenue per account')
    }
    
    return risks
  }
  
  private groupDealsByStage(deals: any[]): any {
    const stages: any = {}
    deals.forEach(d => {
      const stage = d.stage || 'Unknown'
      if (!stages[stage]) {
        stages[stage] = { count: 0, value: 0 }
      }
      stages[stage].count++
      stages[stage].value += Number(d.amount || 0)
    })
    return stages
  }
  
  private groupActivitiesByType(activities: any[]): any {
    const types: any = {}
    activities.forEach(a => {
      const type = a.type || 'Other'
      types[type] = (types[type] || 0) + 1
    })
    return types
  }
  
  private groupContactsBySource(contacts: any[]): any {
    const sources: any = {}
    contacts.forEach(c => {
      const source = (c as any).source || 'Direct'
      sources[source] = (sources[source] || 0) + 1
    })
    return sources
  }

  private async enhanceWithRealTimeData(
    response: AgentResponse,
    user: User,
  ): Promise<AgentResponse> {
    // Add real-time visualizations if mentioned in response
    if (response.content.toLowerCase().includes('chart') || response.content.toLowerCase().includes('graph')) {
      const chartData = await this.generateChartData(user.tenant.id)
      response.visualizations = [chartData]
    }
    
    // Add specific metrics if mentioned
    if (response.content.toLowerCase().includes('revenue') || response.content.toLowerCase().includes('sales')) {
      const metrics = await this.getKeyMetrics(user.tenant.id)
      response.content += `\n\nCurrent Metrics:\n${JSON.stringify(metrics, null, 2)}`
    }
    
    return response
  }

  private async generateChartData(tenantId: string): Promise<any> {
    const deals = await this.dealRepo.find({ where: { tenant: { id: tenantId } } })
    
    // Group by month
    const monthlyData: Record<string, number> = {}
    deals.forEach(deal => {
      const month = new Date(deal.closeDate || new Date()).toISOString().slice(0, 7)
      monthlyData[month] = (monthlyData[month] || 0) + Number(deal.amount || 0)
    })
    
    return {
      type: 'line',
      title: 'Revenue Trend',
      data: Object.entries(monthlyData).map(([month, value]) => ({
        month,
        value: Math.round(value / 1000),
      })),
    }
  }

  private async getKeyMetrics(tenantId: string): Promise<any> {
    const deals = await this.dealRepo.find({ where: { tenant: { id: tenantId } } })
    const contacts = await this.contactRepo.count({ where: { tenant: { id: tenantId } } })
    
    return {
      totalRevenue: Math.round(deals.reduce((sum, d) => sum + Number(d.amount || 0), 0) / 1000),
      dealCount: deals.length,
      contactCount: contacts,
      avgDealSize: Math.round(deals.reduce((sum, d) => sum + Number(d.amount || 0), 0) / deals.length / 1000),
    }
  }

  async getSuggestedActions(user: User): Promise<any[]> {
    // Get agent for user
    const agent = this.agentFactory.getAgentForUser(user)
    
    // Get business context
    const businessData = await this.gatherBusinessContext(user)
    
    // Build context
    const context: AgentContext = {
      user,
      tenantId: user.tenant.id,
      conversation: [],
      businessData,
    }
    
    // Get proactive suggestions
    const response = await agent.processQuery(
      'What are the most important actions I should take today?',
      context
    )
    
    return response.actions || []
  }

  async clearConversation(conversationId: string): Promise<void> {
    if (!this.redis) return // Skip if Redis not available
    
    try {
      await this.redis.del(conversationId)
    } catch (error) {
      console.warn('Failed to clear conversation:', error)
    }
  }

  async analyzeDocument(
    user: User,
    documentContent: string,
    documentName: string,
    query?: string,
  ): Promise<AgentResponse> {
    // Split large documents into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 100,
    })
    
    const docs = await splitter.createDocuments([documentContent])
    
    // Get appropriate agent for user
    const agent = this.agentFactory.getAgentForUser(user)
    
    // Build context with document summary
    const documentSummary = docs.slice(0, 3).map(d => d.pageContent).join('\n\n')
    
    const context: AgentContext = {
      user,
      tenantId: user.tenant.id,
      conversation: [
        new HumanMessage(`Document Analysis Request for: ${documentName}\n\nDocument Content (Preview):\n${documentSummary}`),
      ],
      businessData: {
        documentName,
        documentSize: documentContent.length,
        chunkCount: docs.length,
      },
    }
    
    // Process query with document context
    const analysisQuery = query || `Please analyze this document and provide key insights relevant to my role as ${(user as any).roleTitle || user.role?.name}`
    const response = await agent.processQuery(analysisQuery, context)
    
    // Add document-specific actions
    response.actions = response.actions || []
    response.actions.push({
      type: 'recommendation',
      title: 'Document Action Items',
      description: 'Extract and track action items from this document',
      impact: 'Ensure nothing falls through the cracks',
      requiresApproval: false,
      actionData: {
        documentName,
        extractedItems: this.extractActionItems(documentContent),
      },
    })
    
    return response
  }

  private extractActionItems(content: string): string[] {
    const actionItems: string[] = []
    const lines = content.split('\n')
    
    for (const line of lines) {
      const lower = line.toLowerCase()
      if (
        lower.includes('action:') ||
        lower.includes('todo:') ||
        lower.includes('next step:') ||
        lower.includes('follow up:') ||
        lower.includes('must') ||
        lower.includes('should') ||
        lower.includes('require')
      ) {
        actionItems.push(line.trim())
      }
    }
    
    return actionItems.slice(0, 5) // Return top 5 action items
  }
}