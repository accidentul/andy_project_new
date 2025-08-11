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
    const roleTitle = (user as any).roleTitle || user.role?.name
    const department = (user as any).department
    
    const context: any = {
      userRole: roleTitle,
      department,
    }
    
    // Gather role-specific data
    if (roleTitle?.toLowerCase().includes('ceo') || roleTitle?.toLowerCase().includes('executive')) {
      // CEO gets company-wide metrics
      const deals = await this.dealRepo.find({ where: { tenant: { id: tenantId } } })
      const totalRevenue = deals.reduce((sum, d) => sum + Number(d.amount || 0), 0)
      
      context.revenue = {
        current: Math.round(totalRevenue / 1000000),
        growth: 15, // Would calculate from historical data
      }
      
      context.performance = {
        overall: 78,
        marketShare: 12,
      }
    } else if (department?.toLowerCase().includes('sales')) {
      // Sales gets pipeline and deal metrics
      const deals = await this.dealRepo.find({ where: { tenant: { id: tenantId } } })
      const openDeals = deals.filter(d => !d.stage?.toLowerCase().includes('closed'))
      const wonDeals = deals.filter(d => d.stage?.toLowerCase().includes('won'))
      
      context.pipeline = {
        total: Math.round(openDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0) / 1000000),
        qualified: Math.round(openDeals.filter(d => d.stage?.includes('Qualified')).reduce((sum, d) => sum + Number(d.amount || 0), 0) / 1000000),
        coverage: 2.5,
      }
      
      context.deals = {
        count: openDeals.length,
        averageSize: Math.round(openDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0) / openDeals.length / 1000),
        winRate: Math.round((wonDeals.length / deals.length) * 100),
      }
    } else if (department?.toLowerCase().includes('marketing')) {
      // Marketing gets campaign and lead metrics
      const contacts = await this.contactRepo.find({ where: { tenant: { id: tenantId } } })
      const activities = await this.activityRepo.find({ where: { tenant: { id: tenantId } } })
      
      context.campaigns = {
        active: 5,
        avgROI: 250,
        topPerformer: 'Q4 Product Launch',
      }
      
      context.leads = {
        mqls: contacts.length,
        conversionRate: 15,
        cpl: 150,
      }
    }
    
    return context
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