import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import Redis from 'ioredis'
import { AgentFactory } from './agents/agent.factory'
import { AgentContext, AgentResponse } from './agents/base.agent'
import { User } from '../users/user.entity'
import { CrmAccount, CrmActivity, CrmContact, CrmDeal } from '../connectors/unified-crm.entities'

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
  
  async processWithToolAgent(
    user: User,
    query: string,
    conversationId?: string,
  ): Promise<AgentResponse> {
    // Use regular agent processing since LangChain was removed
    return this.processUserQuery(user, query, conversationId)
  }

  private async getConversationHistory(conversationId: string): Promise<any[]> {
    if (!this.redis) return [] // Return empty history if Redis not available
    
    try {
      const history = await this.redis.get(conversationId)
      if (!history) return []
      
      const messages = JSON.parse(history)
      return messages
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
    
    // Fetch all relevant data
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
      },
      currentMetrics: {
        totalRevenue,
        pipelineValue,
        dealCount: deals.length,
        contactCount: contacts.length,
        avgDealSize: Math.round(avgDealSize)
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
    // Simplified document analysis without text splitter
    const docs = [{ pageContent: documentContent.slice(0, 1000) }]
    
    // Get appropriate agent for user
    const agent = this.agentFactory.getAgentForUser(user)
    
    // Build context with document summary
    const documentSummary = docs.slice(0, 3).map(d => d.pageContent).join('\n\n')
    
    const context: AgentContext = {
      user,
      tenantId: user.tenant.id,
      conversation: [
        { role: 'user', content: `Document Analysis Request for: ${documentName}\n\nDocument Content (Preview):\n${documentSummary}` },
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
  
  private extractActionsFromTools(toolsUsed: string[]): any[] {
    const actions = []
    
    if (toolsUsed.includes('generate_board_presentation')) {
      actions.push({
        type: 'automation',
        title: 'Board Presentation Generated',
        description: 'Executive presentation has been created with current metrics',
        impact: 'Ready for board meeting',
        requiresApproval: false
      })
    }
    
    if (toolsUsed.includes('create_deal') || toolsUsed.includes('update_deal_stage')) {
      actions.push({
        type: 'automation',
        title: 'CRM Updated',
        description: 'Deal information has been modified in the system',
        impact: 'Pipeline metrics updated',
        requiresApproval: false
      })
    }
    
    if (toolsUsed.includes('export_data')) {
      actions.push({
        type: 'automation',
        title: 'Data Exported',
        description: 'Data has been exported to file',
        impact: 'File ready for download',
        requiresApproval: false
      })
    }
    
    return actions
  }
}