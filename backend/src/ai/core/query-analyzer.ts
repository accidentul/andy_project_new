import { Injectable } from '@nestjs/common'

export enum QueryIntent {
  // Analytics
  ANALYZE_METRICS = 'analyze_metrics',
  ANALYZE_PERFORMANCE = 'analyze_performance',
  ANALYZE_WIN_LOSS = 'analyze_win_loss',
  ANALYZE_TRENDS = 'analyze_trends',
  
  // Information Retrieval
  GET_USERS = 'get_users',
  GET_DEALS = 'get_deals',
  GET_TOP_DEALS = 'get_top_deals',
  GET_ACCOUNTS = 'get_accounts',
  GET_PIPELINE = 'get_pipeline',
  GET_LOST_DEALS = 'get_lost_deals',
  
  // Recommendations
  RECOMMEND_ACTIONS = 'recommend_actions',
  RECOMMEND_IMPROVEMENTS = 'recommend_improvements',
  RECOMMEND_FOCUS = 'recommend_focus',
  
  // Forecasting
  FORECAST_REVENUE = 'forecast_revenue',
  FORECAST_PIPELINE = 'forecast_pipeline',
  
  // Questions
  EXPLAIN_WHY = 'explain_why',
  EXPLAIN_HOW = 'explain_how',
  EXPLAIN_WHAT = 'explain_what',
  
  // General
  GENERAL_QUERY = 'general_query',
}

export interface QueryAnalysis {
  intent: QueryIntent
  entities: {
    metrics?: string[]
    timeframe?: string
    departments?: string[]
    users?: string[]
    dealStages?: string[]
    comparison?: boolean
  }
  confidence: number
  keywords: string[]
  requiresContext: boolean
}

@Injectable()
export class QueryAnalyzer {
  private intentPatterns = new Map<QueryIntent, RegExp[]>([
    [QueryIntent.ANALYZE_WIN_LOSS, [
      /win.*rate/i,
      /loss.*rate/i,
      /why.*los[et]/i,
      /why.*won/i,
      /win.*loss/i,
      /conversion/i,
    ]],
    [QueryIntent.ANALYZE_PERFORMANCE, [
      /how.*doing/i,
      /performance/i,
      /metrics/i,
      /kpi/i,
      /dashboard/i,
      /status/i,
    ]],
    [QueryIntent.GET_USERS, [
      /who.*users/i,
      /list.*users/i,
      /show.*users/i,
      /users.*organization/i,
      /team.*members/i,
      /employees/i,
    ]],
    [QueryIntent.GET_DEALS, [
      /show.*deals/i,
      /list.*deals/i,
      /opportunities/i,
      /deals.*pipeline/i,
      /major.*deals/i,
    ]],
    [QueryIntent.GET_TOP_DEALS, [
      /best.*earning/i,
      /top.*earning/i,
      /highest.*value/i,
      /biggest.*deals/i,
      /largest.*deals/i,
      /top\s+\d+\s+deals/i,
      /top.*deals/i,
      /best.*deals/i,
      /most.*valuable/i,
      /highest.*revenue/i,
      /top.*performers/i,
      /show.*top.*deals/i,
    ]],
    [QueryIntent.GET_LOST_DEALS, [
      /lost.*deals/i,
      /show.*lost/i,
      /list.*lost/i,
      /closed.*lost/i,
      /failed.*deals/i,
      /what.*lost/i,
    ]],
    [QueryIntent.GET_PIPELINE, [
      /pipeline/i,
      /funnel/i,
      /sales.*stages/i,
      /opportunity.*stages/i,
    ]],
    [QueryIntent.RECOMMEND_ACTIONS, [
      /what.*should/i,
      /how.*can.*i/i,
      /how.*to.*improve/i,
      /how.*fix/i,
      /recommend/i,
      /suggest/i,
      /advice/i,
    ]],
    [QueryIntent.EXPLAIN_WHY, [
      /why/i,
      /reason/i,
      /cause/i,
      /because/i,
    ]],
    [QueryIntent.EXPLAIN_HOW, [
      /how.*to/i,
      /how.*can/i,
      /how.*should/i,
      /how.*do/i,
    ]],
    [QueryIntent.FORECAST_REVENUE, [
      /forecast/i,
      /predict/i,
      /projection/i,
      /future.*revenue/i,
      /next.*quarter/i,
      /next.*month/i,
    ]],
    [QueryIntent.ANALYZE_TRENDS, [
      /trend/i,
      /pattern/i,
      /over.*time/i,
      /historical/i,
      /growth/i,
      /decline/i,
    ]],
  ])

  private entityPatterns = {
    metrics: [
      'revenue', 'pipeline', 'deals', 'accounts', 'contacts',
      'win rate', 'conversion', 'velocity', 'cycle time',
      'average deal size', 'quota', 'target'
    ],
    timeframes: [
      'today', 'yesterday', 'this week', 'last week',
      'this month', 'last month', 'this quarter', 'last quarter',
      'this year', 'last year', 'ytd', 'mtd', 'qtd'
    ],
    dealStages: [
      'prospecting', 'qualification', 'proposal', 'negotiation',
      'closed won', 'closed lost', 'demo', 'discovery'
    ],
    departments: [
      'sales', 'marketing', 'engineering', 'finance',
      'hr', 'operations', 'customer success', 'executive'
    ]
  }

  analyze(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase()
    const words = lowerQuery.split(/\s+/)
    
    // Determine primary intent
    let intent = QueryIntent.GENERAL_QUERY
    let maxScore = 0
    
    for (const [intentType, patterns] of this.intentPatterns) {
      let score = 0
      for (const pattern of patterns) {
        if (pattern.test(lowerQuery)) {
          score += 1
        }
      }
      if (score > maxScore) {
        maxScore = score
        intent = intentType
      }
    }
    
    // Extract entities
    const entities: QueryAnalysis['entities'] = {}
    
    // Extract metrics
    entities.metrics = this.entityPatterns.metrics.filter(metric => 
      lowerQuery.includes(metric.toLowerCase())
    )
    
    // Extract timeframe
    for (const timeframe of this.entityPatterns.timeframes) {
      if (lowerQuery.includes(timeframe)) {
        entities.timeframe = timeframe
        break
      }
    }
    
    // Extract deal stages
    entities.dealStages = this.entityPatterns.dealStages.filter(stage =>
      lowerQuery.includes(stage.toLowerCase())
    )
    
    // Extract departments
    entities.departments = this.entityPatterns.departments.filter(dept =>
      lowerQuery.includes(dept.toLowerCase())
    )
    
    // Check for comparison keywords
    entities.comparison = /compar|versus|vs\.|against|between/i.test(lowerQuery)
    
    // Determine if context is needed
    const requiresContext = /\bit\b|\bthis\b|\bthat\b|\bthey\b|\bthem\b|\bthose\b|\bthese\b/i.test(lowerQuery)
    
    // Calculate confidence based on pattern matches
    const confidence = maxScore > 0 ? Math.min(maxScore / 3, 1) : 0.3
    
    return {
      intent,
      entities,
      confidence,
      keywords: words.filter(w => w.length > 3),
      requiresContext
    }
  }

  // Refine intent based on context
  refineWithContext(analysis: QueryAnalysis, context: any): QueryAnalysis {
    // If the query references something from context
    if (analysis.requiresContext && context.lastTopic) {
      // Adjust intent based on what was previously discussed
      if (context.lastTopic === 'deals' && analysis.intent === QueryIntent.GENERAL_QUERY) {
        analysis.intent = QueryIntent.GET_DEALS
      }
      if (context.lastTopic === 'win_rate' && analysis.intent === QueryIntent.EXPLAIN_WHY) {
        analysis.intent = QueryIntent.ANALYZE_WIN_LOSS
      }
    }
    
    return analysis
  }
}