import { Injectable } from '@nestjs/common'
import { QueryAnalysis, QueryIntent } from './query-analyzer'

export interface ConversationContext {
  conversationId: string
  userId: string
  tenantId: string
  messages: ConversationMessage[]
  currentTopic?: string
  lastIntent?: QueryIntent
  entities: {
    mentionedMetrics: Set<string>
    timeframes: Set<string>
    dealStages: Set<string>
    recentQueries: string[]
  }
  createdAt: Date
  lastUpdated: Date
}

export interface ConversationMessage {
  id: string
  query: string
  intent: QueryIntent
  response: string
  toolsUsed: string[]
  timestamp: Date
  entities: any
}

@Injectable()
export class ContextManager {
  private contexts: Map<string, ConversationContext> = new Map()
  private readonly maxContextAge = 24 * 60 * 60 * 1000 // 24 hours
  private readonly maxMessages = 50

  getContext(conversationId: string, userId: string, tenantId: string): ConversationContext {
    let context = this.contexts.get(conversationId)
    
    if (!context) {
      context = {
        conversationId,
        userId,
        tenantId,
        messages: [],
        entities: {
          mentionedMetrics: new Set(),
          timeframes: new Set(),
          dealStages: new Set(),
          recentQueries: [],
        },
        createdAt: new Date(),
        lastUpdated: new Date(),
      }
      this.contexts.set(conversationId, context)
    }

    // Clean up old contexts periodically
    this.cleanupOldContexts()

    return context
  }

  updateContext(
    conversationId: string,
    query: string,
    analysis: QueryAnalysis,
    response: string,
    toolsUsed: string[]
  ): void {
    const context = this.contexts.get(conversationId)
    if (!context) return

    // Add new message
    const message: ConversationMessage = {
      id: this.generateMessageId(),
      query,
      intent: analysis.intent,
      response,
      toolsUsed,
      timestamp: new Date(),
      entities: analysis.entities,
    }

    context.messages.push(message)

    // Update context entities
    this.updateContextEntities(context, analysis)

    // Set current topic based on intent
    context.currentTopic = this.getTopicFromIntent(analysis.intent)
    context.lastIntent = analysis.intent
    context.lastUpdated = new Date()

    // Limit message history
    if (context.messages.length > this.maxMessages) {
      context.messages = context.messages.slice(-this.maxMessages)
    }

    // Update recent queries
    context.entities.recentQueries.push(query.toLowerCase())
    if (context.entities.recentQueries.length > 10) {
      context.entities.recentQueries = context.entities.recentQueries.slice(-10)
    }
  }

  getContextForQuery(conversationId: string): any {
    const context = this.contexts.get(conversationId)
    if (!context) return null

    return {
      lastTopic: context.currentTopic,
      lastIntent: context.lastIntent,
      mentionedMetrics: Array.from(context.entities.mentionedMetrics),
      recentTimeframes: Array.from(context.entities.timeframes),
      recentQueries: context.entities.recentQueries,
      messageCount: context.messages.length,
      conversationAge: Date.now() - context.createdAt.getTime(),
    }
  }

  getConversationSummary(conversationId: string): string {
    const context = this.contexts.get(conversationId)
    if (!context || context.messages.length === 0) {
      return 'No conversation history available.'
    }

    const recentMessages = context.messages.slice(-5)
    const topics = new Set<string>()
    const intents = new Set<QueryIntent>()

    recentMessages.forEach(msg => {
      if (msg.intent !== QueryIntent.GENERAL_QUERY) {
        intents.add(msg.intent)
      }
      const topic = this.getTopicFromIntent(msg.intent)
      if (topic) topics.add(topic)
    })

    let summary = `Recent conversation (${recentMessages.length} messages):\n`
    
    if (topics.size > 0) {
      summary += `Topics discussed: ${Array.from(topics).join(', ')}\n`
    }

    if (context.entities.mentionedMetrics.size > 0) {
      summary += `Metrics mentioned: ${Array.from(context.entities.mentionedMetrics).slice(0, 5).join(', ')}\n`
    }

    return summary
  }

  suggestFollowUpQuestions(conversationId: string): string[] {
    const context = this.contexts.get(conversationId)
    if (!context || context.messages.length === 0) {
      return [
        'What\'s the current state of our pipeline?',
        'How is our win rate looking?',
        'What are our revenue forecasts?',
        'Are there any risks I should know about?'
      ]
    }

    const lastMessage = context.messages[context.messages.length - 1]
    const lastIntent = lastMessage.intent
    const suggestions: string[] = []

    switch (lastIntent) {
      case QueryIntent.ANALYZE_WIN_LOSS:
        suggestions.push(
          'What are the main reasons we\'re losing deals?',
          'How can we improve our win rate?',
          'Which competitors are we losing to most?',
          'What\'s our forecast based on current performance?'
        )
        break

      case QueryIntent.GET_LOST_DEALS:
        suggestions.push(
          'How can we prevent these losses in the future?',
          'What\'s our overall win rate?',
          'Are there patterns in our lost deals?',
          'Can we win back any of these prospects?'
        )
        break

      case QueryIntent.ANALYZE_PERFORMANCE:
        suggestions.push(
          'What are our biggest risks?',
          'Which opportunities should we prioritize?',
          'How does this compare to last quarter?',
          'What actions should we take immediately?'
        )
        break

      case QueryIntent.FORECAST_REVENUE:
        suggestions.push(
          'What could impact this forecast?',
          'Which deals are most likely to close?',
          'How confident are we in this prediction?',
          'What scenarios should we prepare for?'
        )
        break

      default:
        suggestions.push(
          'Can you provide more details?',
          'What trends should we watch?',
          'How does this compare to benchmarks?',
          'What are the next steps?'
        )
    }

    // Avoid suggesting questions similar to recent ones
    const recentQueries = context.entities.recentQueries
    return suggestions.filter(suggestion => {
      const lowerSuggestion = suggestion.toLowerCase()
      return !recentQueries.some(query => 
        this.calculateSimilarity(query, lowerSuggestion) > 0.6
      )
    }).slice(0, 4)
  }

  private updateContextEntities(context: ConversationContext, analysis: QueryAnalysis): void {
    // Update mentioned metrics
    if (analysis.entities.metrics) {
      analysis.entities.metrics.forEach(metric => {
        context.entities.mentionedMetrics.add(metric.toLowerCase())
      })
    }

    // Update timeframes
    if (analysis.entities.timeframe) {
      context.entities.timeframes.add(analysis.entities.timeframe.toLowerCase())
    }

    // Update deal stages
    if (analysis.entities.dealStages) {
      analysis.entities.dealStages.forEach(stage => {
        context.entities.dealStages.add(stage.toLowerCase())
      })
    }

    // Limit the size of sets to prevent memory bloat
    if (context.entities.mentionedMetrics.size > 20) {
      const metrics = Array.from(context.entities.mentionedMetrics)
      context.entities.mentionedMetrics = new Set(metrics.slice(-15))
    }

    if (context.entities.timeframes.size > 10) {
      const timeframes = Array.from(context.entities.timeframes)
      context.entities.timeframes = new Set(timeframes.slice(-8))
    }

    if (context.entities.dealStages.size > 10) {
      const stages = Array.from(context.entities.dealStages)
      context.entities.dealStages = new Set(stages.slice(-8))
    }
  }

  private getTopicFromIntent(intent: QueryIntent): string | undefined {
    const topicMap: { [key in QueryIntent]?: string } = {
      [QueryIntent.ANALYZE_WIN_LOSS]: 'win_loss',
      [QueryIntent.GET_LOST_DEALS]: 'lost_deals',
      [QueryIntent.ANALYZE_PERFORMANCE]: 'performance',
      [QueryIntent.ANALYZE_METRICS]: 'metrics',
      [QueryIntent.FORECAST_REVENUE]: 'forecast',
      [QueryIntent.ANALYZE_TRENDS]: 'trends',
      [QueryIntent.GET_DEALS]: 'deals',
      [QueryIntent.GET_PIPELINE]: 'pipeline',
      [QueryIntent.RECOMMEND_ACTIONS]: 'recommendations',
    }

    return topicMap[intent]
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private cleanupOldContexts(): void {
    const now = Date.now()
    const toDelete: string[] = []

    for (const [conversationId, context] of this.contexts.entries()) {
      if (now - context.lastUpdated.getTime() > this.maxContextAge) {
        toDelete.push(conversationId)
      }
    }

    toDelete.forEach(id => {
      this.contexts.delete(id)
    })
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation based on common words
    const words1 = str1.toLowerCase().split(/\s+/)
    const words2 = str2.toLowerCase().split(/\s+/)
    
    const set1 = new Set(words1.filter(w => w.length > 3))
    const set2 = new Set(words2.filter(w => w.length > 3))
    
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    
    return union.size === 0 ? 0 : intersection.size / union.size
  }

  // Method to export context for debugging or analysis
  exportContext(conversationId: string): any {
    const context = this.contexts.get(conversationId)
    if (!context) return null

    return {
      conversationId: context.conversationId,
      userId: context.userId,
      tenantId: context.tenantId,
      messageCount: context.messages.length,
      currentTopic: context.currentTopic,
      lastIntent: context.lastIntent,
      entities: {
        mentionedMetrics: Array.from(context.entities.mentionedMetrics),
        timeframes: Array.from(context.entities.timeframes),
        dealStages: Array.from(context.entities.dealStages),
        recentQueries: context.entities.recentQueries,
      },
      createdAt: context.createdAt,
      lastUpdated: context.lastUpdated,
      messages: context.messages.map(msg => ({
        id: msg.id,
        query: msg.query,
        intent: msg.intent,
        toolsUsed: msg.toolsUsed,
        timestamp: msg.timestamp,
      }))
    }
  }

  // Method to get conversation statistics
  getStats(): any {
    return {
      activeContexts: this.contexts.size,
      totalMessages: Array.from(this.contexts.values())
        .reduce((sum, ctx) => sum + ctx.messages.length, 0),
      oldestContext: Math.min(...Array.from(this.contexts.values())
        .map(ctx => ctx.createdAt.getTime())),
    }
  }
}