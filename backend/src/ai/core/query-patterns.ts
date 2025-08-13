import { QueryPlan } from '../services/ai-query-planner.service'

export interface QueryPattern {
  name: string
  description: string
  matches: (query: string) => boolean
  buildPlan: (query: string, context: any) => Partial<QueryPlan>
  examples: string[]
}

export class QueryPatternLibrary {
  private patterns: QueryPattern[] = []
  
  constructor() {
    this.initializePatterns()
  }
  
  private initializePatterns() {
    // Pattern: X by Y (aggregation with grouping)
    this.patterns.push({
      name: 'metric_by_dimension',
      description: 'Aggregate a metric grouped by a dimension',
      matches: (query: string) => {
        const pattern = /(?:show|get|display|list)?\s*(.+?)\s+(?:by|per|for each|grouped by)\s+(.+)/i
        return pattern.test(query)
      },
      buildPlan: (query: string, context: any) => {
        const pattern = /(?:show|get|display|list)?\s*(.+?)\s+(?:by|per|for each|grouped by)\s+(.+)/i
        const match = query.match(pattern)
        
        if (!match) return {}
        
        const metric = match[1].trim().toLowerCase()
        const dimension = match[2].trim().toLowerCase()
        
        // Map common metrics
        const metricMap: Record<string, { table: string, column: string, aggregation: string }> = {
          'sales': { table: 'crm_deals', column: 'amount', aggregation: 'SUM' },
          'revenue': { table: 'crm_deals', column: 'amount', aggregation: 'SUM' },
          'deals': { table: 'crm_deals', column: '*', aggregation: 'COUNT' },
          'count': { table: 'crm_deals', column: '*', aggregation: 'COUNT' },
          'opportunities': { table: 'crm_deals', column: '*', aggregation: 'COUNT' },
          'customers': { table: 'crm_accounts', column: '*', aggregation: 'COUNT' },
          'accounts': { table: 'crm_accounts', column: '*', aggregation: 'COUNT' },
          'activities': { table: 'crm_activities', column: '*', aggregation: 'COUNT' }
        }
        
        // Map common dimensions
        const dimensionMap: Record<string, { table: string, column: string }> = {
          'stage': { table: 'crm_deals', column: 'stage' },
          'status': { table: 'crm_deals', column: 'stage' },
          'owner': { table: 'crm_deals', column: 'owner' },
          'rep': { table: 'crm_deals', column: 'owner' },
          'month': { table: 'crm_deals', column: 'closeDate' },
          'quarter': { table: 'crm_deals', column: 'closeDate' },
          'industry': { table: 'crm_accounts', column: 'industry' },
          'type': { table: 'crm_activities', column: 'type' }
        }
        
        const metricInfo = metricMap[metric] || { table: 'crm_deals', column: '*', aggregation: 'COUNT' }
        const dimensionInfo = dimensionMap[dimension] || { table: metricInfo.table, column: dimension }
        
        return {
          primaryTable: metricInfo.table,
          columns: [
            {
              table: dimensionInfo.table,
              column: dimensionInfo.column
            },
            {
              table: metricInfo.table,
              column: metricInfo.column,
              aggregation: metricInfo.aggregation as any,
              alias: metric.replace(/\s+/g, '_')
            }
          ],
          groupBy: [
            {
              table: dimensionInfo.table,
              column: dimensionInfo.column
            }
          ]
        }
      },
      examples: [
        'sales by stage',
        'revenue by month',
        'deals by owner',
        'customers by industry'
      ]
    })
    
    // Pattern: Top N X by Y
    this.patterns.push({
      name: 'top_n_ranking',
      description: 'Get top N records ordered by a metric',
      matches: (query: string) => {
        const pattern = /(?:top|bottom|best|worst|highest|lowest)\s+(\d+)?\s*(.+?)(?:\s+by\s+(.+))?/i
        return pattern.test(query)
      },
      buildPlan: (query: string, context: any) => {
        const pattern = /(?:top|bottom|best|worst|highest|lowest)\s+(\d+)?\s*(.+?)(?:\s+by\s+(.+))?/i
        const match = query.match(pattern)
        
        if (!match) return {}
        
        const isTop = query.toLowerCase().includes('top') || 
                     query.toLowerCase().includes('best') || 
                     query.toLowerCase().includes('highest')
        const limit = match[1] ? parseInt(match[1]) : 10
        const entity = match[2].trim().toLowerCase()
        const orderByMetric = match[3]?.trim().toLowerCase() || 'amount'
        
        // Map entities to tables
        const entityMap: Record<string, string> = {
          'deals': 'crm_deals',
          'opportunities': 'crm_deals',
          'accounts': 'crm_accounts',
          'customers': 'crm_accounts',
          'contacts': 'crm_contacts'
        }
        
        const table = entityMap[entity] || 'crm_deals'
        
        return {
          primaryTable: table,
          columns: [
            { table, column: 'id' },
            { table, column: 'name' },
            { table, column: orderByMetric }
          ],
          orderBy: [
            {
              table,
              column: orderByMetric,
              direction: isTop ? 'DESC' : 'ASC'
            }
          ],
          limit
        }
      },
      examples: [
        'top 10 deals by amount',
        'bottom 5 accounts by revenue',
        'highest 20 opportunities'
      ]
    })
    
    // Pattern: Distribution/Breakdown
    this.patterns.push({
      name: 'distribution',
      description: 'Show distribution or breakdown of entities',
      matches: (query: string) => {
        const pattern = /(?:distribution|breakdown|composition|spread)\s+(?:of\s+)?(.+?)(?:\s+by\s+(.+))?/i
        return pattern.test(query)
      },
      buildPlan: (query: string, context: any) => {
        const pattern = /(?:distribution|breakdown|composition|spread)\s+(?:of\s+)?(.+?)(?:\s+by\s+(.+))?/i
        const match = query.match(pattern)
        
        if (!match) return {}
        
        const entity = match[1].trim().toLowerCase()
        const dimension = match[2]?.trim().toLowerCase() || 'stage'
        
        const entityMap: Record<string, string> = {
          'deals': 'crm_deals',
          'opportunities': 'crm_deals',
          'pipeline': 'crm_deals',
          'accounts': 'crm_accounts',
          'customers': 'crm_accounts'
        }
        
        const table = entityMap[entity] || 'crm_deals'
        
        return {
          primaryTable: table,
          columns: [
            { table, column: dimension },
            { 
              table, 
              column: '*', 
              aggregation: 'COUNT' as any,
              alias: 'count'
            }
          ],
          groupBy: [
            { table, column: dimension }
          ],
          orderBy: [
            { table, column: 'count', direction: 'DESC' }
          ],
          visualization: 'pie' as any
        }
      },
      examples: [
        'distribution of deals by stage',
        'breakdown of customers by industry',
        'pipeline composition'
      ]
    })
    
    // Pattern: Comparison
    this.patterns.push({
      name: 'comparison',
      description: 'Compare metrics between different periods or categories',
      matches: (query: string) => {
        const pattern = /(?:compare|versus|vs\.?|difference between)\s+(.+?)\s+(?:and|vs\.?|versus|with)\s+(.+)/i
        return pattern.test(query)
      },
      buildPlan: (query: string, context: any) => {
        // This is a complex pattern that would need special handling
        // For now, return a basic structure
        return {
          primaryTable: 'crm_deals',
          columns: [
            { table: 'crm_deals', column: 'stage' },
            { table: 'crm_deals', column: 'amount', aggregation: 'SUM' as any }
          ],
          visualization: 'bar' as any
        }
      },
      examples: [
        'compare this month vs last month',
        'sales this quarter versus last quarter'
      ]
    })
    
    // Pattern: Trend over time
    this.patterns.push({
      name: 'trend',
      description: 'Show trend of metrics over time',
      matches: (query: string) => {
        const pattern = /(?:trend|over time|timeline|by month|by week|by day|monthly|weekly|daily)\s*(?:of\s+)?(.+)?/i
        return pattern.test(query)
      },
      buildPlan: (query: string, context: any) => {
        const pattern = /(?:trend|over time|timeline|by month|by week|by day|monthly|weekly|daily)\s*(?:of\s+)?(.+)?/i
        const match = query.match(pattern)
        
        const metric = match?.[1]?.trim().toLowerCase() || 'revenue'
        
        const metricMap: Record<string, { column: string, aggregation: string }> = {
          'sales': { column: 'amount', aggregation: 'SUM' },
          'revenue': { column: 'amount', aggregation: 'SUM' },
          'deals': { column: '*', aggregation: 'COUNT' },
          'activities': { column: '*', aggregation: 'COUNT' }
        }
        
        const metricInfo = metricMap[metric] || { column: 'amount', aggregation: 'SUM' }
        
        return {
          primaryTable: 'crm_deals',
          columns: [
            { 
              table: 'crm_deals', 
              column: 'closeDate',
              expression: 'DATE(closeDate)' // Group by date
            },
            { 
              table: 'crm_deals', 
              column: metricInfo.column, 
              aggregation: metricInfo.aggregation as any,
              alias: metric
            }
          ],
          groupBy: [
            { 
              table: 'crm_deals', 
              column: 'closeDate',
              expression: 'DATE(closeDate)'
            }
          ],
          orderBy: [
            { table: 'crm_deals', column: 'closeDate', direction: 'ASC' }
          ],
          visualization: 'line' as any
        }
      },
      examples: [
        'revenue trend over time',
        'monthly sales',
        'deals by month',
        'activity timeline'
      ]
    })
    
    // Pattern: Simple count
    this.patterns.push({
      name: 'simple_count',
      description: 'Count total number of entities',
      matches: (query: string) => {
        const pattern = /(?:how many|count|number of|total)\s+(.+)/i
        return pattern.test(query)
      },
      buildPlan: (query: string, context: any) => {
        const pattern = /(?:how many|count|number of|total)\s+(.+)/i
        const match = query.match(pattern)
        
        if (!match) return {}
        
        const entity = match[1].trim().toLowerCase()
        
        const entityMap: Record<string, string> = {
          'deals': 'crm_deals',
          'opportunities': 'crm_deals',
          'accounts': 'crm_accounts',
          'customers': 'crm_accounts',
          'contacts': 'crm_contacts',
          'activities': 'crm_activities'
        }
        
        const table = entityMap[entity] || 'crm_deals'
        
        return {
          primaryTable: table,
          columns: [
            { 
              table, 
              column: '*', 
              aggregation: 'COUNT' as any,
              alias: 'total_count'
            }
          ]
        }
      },
      examples: [
        'how many deals',
        'count of customers',
        'total opportunities'
      ]
    })
  }
  
  findMatchingPattern(query: string): QueryPattern | undefined {
    for (const pattern of this.patterns) {
      if (pattern.matches(query)) {
        return pattern
      }
    }
    return undefined
  }
  
  getAllPatterns(): QueryPattern[] {
    return this.patterns
  }
  
  buildQueryPlan(query: string, context: any): Partial<QueryPlan> | undefined {
    // Check if query needs JOINs - if so, don't use patterns
    const needsJoin = this.requiresJoin(query)
    if (needsJoin) {
      console.log('[QueryPatternLibrary] Query requires JOIN, skipping pattern matching')
      return undefined // Let AI handle JOIN queries
    }
    
    const pattern = this.findMatchingPattern(query)
    if (pattern) {
      return pattern.buildPlan(query, context)
    }
    return undefined
  }
  
  private requiresJoin(query: string): boolean {
    const lowerQuery = query.toLowerCase()
    
    // Keywords that indicate JOIN is needed
    const joinIndicators = [
      'with account',
      'with customer',
      'with contact',
      'and their',
      'including',
      'joined with',
      'join',
      'by industry', // industry is on accounts, not deals
      'by account',
      'customer name',
      'account name',
      'contact name',
      'from different',
      'across tables',
      'related'
    ]
    
    return joinIndicators.some(indicator => lowerQuery.includes(indicator))
  }
}