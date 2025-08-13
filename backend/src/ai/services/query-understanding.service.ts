import { Injectable, Logger } from '@nestjs/common'
import { SchemaMetadataService } from './schema-metadata.service'

export interface QueryIntent {
  queryType: 'aggregation' | 'detail' | 'comparison' | 'trend' | 'distribution' | 'ranking'
  entities: {
    primary: string
    related: string[]
  }
  metrics: {
    name: string
    aggregation: 'COUNT' | 'SUM' | 'AVG' | 'MAX' | 'MIN'
    column?: string
  }[]
  dimensions: {
    column: string
    table: string
  }[]
  filters: {
    column: string
    operator: string
    value: any
  }[]
  timeRange?: {
    start?: Date
    end?: Date
    relative?: string
    startStr?: string
    endStr?: string
  }
  limit?: number
  orderBy?: {
    column: string
    direction: 'ASC' | 'DESC'
  }
}

@Injectable()
export class QueryUnderstandingService {
  private readonly logger = new Logger(QueryUnderstandingService.name)
  
  // Common query patterns
  private readonly patterns = {
    aggregation: /(?:total|sum|count|average|avg|mean|max|maximum|min|minimum)\s+(?:of\s+)?(\w+)/gi,
    groupBy: /(?:by|per|for each|grouped by|group by|broken down by|split by)\s+(\w+)/gi,
    comparison: /(?:compare|versus|vs|between|difference)\s+(\w+)\s+(?:and|vs|versus)\s+(\w+)/gi,
    ranking: /(?:top|bottom|best|worst|highest|lowest)\s+(\d+)?\s*(\w+)/gi,
    distribution: /(?:distribution|breakdown|composition|spread)\s+(?:of\s+)?(\w+)/gi,
    trend: /(?:trend|over time|by month|by week|by day|monthly|weekly|daily|timeline)/gi,
    timeRange: {
      thisMonth: /this\s+month/gi,
      lastMonth: /last\s+month/gi,
      thisQuarter: /this\s+quarter/gi,
      lastQuarter: /last\s+quarter/gi,
      thisYear: /this\s+year|YTD|year\s+to\s+date/gi,
      lastYear: /last\s+year/gi,
      today: /today/gi,
      yesterday: /yesterday/gi,
      lastNDays: /(?:last|past)\s+(\d+)\s+days?/gi,
      lastNMonths: /(?:last|past)\s+(\d+)\s+months?/gi
    }
  }
  
  constructor(
    private schemaMetadata: SchemaMetadataService
  ) {}
  
  async understandQuery(query: string): Promise<QueryIntent> {
    this.logger.log(`Understanding query: "${query}"`)
    
    const intent: QueryIntent = {
      queryType: this.detectQueryType(query),
      entities: this.extractEntities(query),
      metrics: this.extractMetrics(query),
      dimensions: this.extractDimensions(query),
      filters: this.extractFilters(query),
      timeRange: this.extractTimeRange(query),
      limit: this.extractLimit(query),
      orderBy: this.extractOrderBy(query)
    }
    
    // Enrich with schema metadata
    this.enrichWithMetadata(intent, query)
    
    // Validate and correct intent
    this.validateIntent(intent)
    
    this.logger.log(`Query intent: ${JSON.stringify(intent, null, 2)}`)
    
    return intent
  }
  
  private detectQueryType(query: string): QueryIntent['queryType'] {
    const lowerQuery = query.toLowerCase()
    
    if (this.patterns.ranking.test(query)) {
      return 'ranking'
    }
    if (this.patterns.distribution.test(query)) {
      return 'distribution'
    }
    if (this.patterns.trend.test(query)) {
      return 'trend'
    }
    if (this.patterns.comparison.test(query)) {
      return 'comparison'
    }
    if (this.patterns.aggregation.test(query) || this.patterns.groupBy.test(query)) {
      return 'aggregation'
    }
    
    return 'detail'
  }
  
  private extractEntities(query: string): QueryIntent['entities'] {
    const entities = {
      primary: '',
      related: [] as string[]
    }
    
    const lowerQuery = query.toLowerCase()
    const businessTerms = this.schemaMetadata.getAllBusinessTerms()
    
    // Find primary entity
    for (const term of businessTerms) {
      if (lowerQuery.includes(term)) {
        const mapping = this.schemaMetadata.getBusinessTerm(term)
        if (mapping && !entities.primary) {
          entities.primary = mapping.table
        } else if (mapping && mapping.table !== entities.primary) {
          entities.related.push(mapping.table)
        }
      }
    }
    
    // If no entity found, try to find table names directly
    if (!entities.primary) {
      const tables = ['crm_deals', 'crm_accounts', 'crm_contacts', 'crm_activities']
      for (const table of tables) {
        const metadata = this.schemaMetadata.getTableMetadata(table)
        if (metadata) {
          const businessName = metadata.businessName.toLowerCase()
          if (lowerQuery.includes(businessName) || lowerQuery.includes(table)) {
            entities.primary = table
            break
          }
        }
      }
    }
    
    // Default to deals if talking about sales/revenue
    if (!entities.primary && (lowerQuery.includes('sales') || lowerQuery.includes('revenue') || lowerQuery.includes('pipeline'))) {
      entities.primary = 'crm_deals'
    }
    
    return entities
  }
  
  private extractMetrics(query: string): QueryIntent['metrics'] {
    const metrics: QueryIntent['metrics'] = []
    const lowerQuery = query.toLowerCase()
    
    // Check for COUNT
    if (lowerQuery.includes('count') || lowerQuery.includes('number of') || lowerQuery.includes('how many')) {
      metrics.push({
        name: 'count',
        aggregation: 'COUNT',
        column: '*'
      })
    }
    
    // Check for SUM/TOTAL
    if (lowerQuery.includes('total') || lowerQuery.includes('sum')) {
      // Look for what to sum
      if (lowerQuery.includes('revenue') || lowerQuery.includes('amount') || lowerQuery.includes('value')) {
        metrics.push({
          name: 'total_amount',
          aggregation: 'SUM',
          column: 'amount'
        })
      }
    }
    
    // Check for AVERAGE
    if (lowerQuery.includes('average') || lowerQuery.includes('avg') || lowerQuery.includes('mean')) {
      if (lowerQuery.includes('deal') || lowerQuery.includes('amount') || lowerQuery.includes('value')) {
        metrics.push({
          name: 'avg_amount',
          aggregation: 'AVG',
          column: 'amount'
        })
      }
    }
    
    // Check for MAX/MIN
    if (lowerQuery.includes('highest') || lowerQuery.includes('maximum') || lowerQuery.includes('max')) {
      metrics.push({
        name: 'max_value',
        aggregation: 'MAX',
        column: 'amount'
      })
    }
    
    if (lowerQuery.includes('lowest') || lowerQuery.includes('minimum') || lowerQuery.includes('min')) {
      metrics.push({
        name: 'min_value',
        aggregation: 'MIN',
        column: 'amount'
      })
    }
    
    // If no metrics found but it's an aggregation query, default to COUNT
    if (metrics.length === 0 && this.detectQueryType(query) === 'aggregation') {
      metrics.push({
        name: 'count',
        aggregation: 'COUNT',
        column: '*'
      })
    }
    
    return metrics
  }
  
  private extractDimensions(query: string): QueryIntent['dimensions'] {
    const dimensions: QueryIntent['dimensions'] = []
    
    // Reset regex lastIndex
    this.patterns.groupBy.lastIndex = 0
    
    let match
    while ((match = this.patterns.groupBy.exec(query)) !== null) {
      const dimension = match[1].toLowerCase()
      
      // Map dimension to column
      let column = dimension
      let table = ''
      
      // Common dimension mappings
      const dimensionMap: Record<string, { column: string, table: string }> = {
        'stage': { column: 'stage', table: 'crm_deals' },
        'status': { column: 'stage', table: 'crm_deals' },
        'owner': { column: 'owner', table: 'crm_deals' },
        'month': { column: 'closeDate', table: 'crm_deals' },
        'quarter': { column: 'closeDate', table: 'crm_deals' },
        'year': { column: 'closeDate', table: 'crm_deals' },
        'industry': { column: 'industry', table: 'crm_accounts' },
        'type': { column: 'type', table: 'crm_activities' },
        'category': { column: 'category', table: '' },
        'rep': { column: 'owner', table: 'crm_deals' },
        'account': { column: 'accountId', table: 'crm_deals' },
        'company': { column: 'accountId', table: 'crm_deals' }
      }
      
      if (dimensionMap[dimension]) {
        column = dimensionMap[dimension].column
        table = dimensionMap[dimension].table
      }
      
      dimensions.push({ column, table })
    }
    
    return dimensions
  }
  
  private extractFilters(query: string): QueryIntent['filters'] {
    const filters: QueryIntent['filters'] = []
    const lowerQuery = query.toLowerCase()
    
    // Check for stage filters
    if (lowerQuery.includes('closed won')) {
      filters.push({
        column: 'stage',
        operator: '=',
        value: 'Closed Won'
      })
    }
    
    if (lowerQuery.includes('closed lost')) {
      filters.push({
        column: 'stage',
        operator: '=',
        value: 'Closed Lost'
      })
    }
    
    if (lowerQuery.includes('open') || lowerQuery.includes('pipeline')) {
      filters.push({
        column: 'stage',
        operator: 'NOT IN',
        value: ['Closed Won', 'Closed Lost']
      })
    }
    
    // Check for value filters
    const valueMatch = lowerQuery.match(/(?:greater than|more than|above|over)\s+\$?([\d,]+)/i)
    if (valueMatch) {
      const value = parseFloat(valueMatch[1].replace(/,/g, ''))
      filters.push({
        column: 'amount',
        operator: '>',
        value
      })
    }
    
    const lessMatch = lowerQuery.match(/(?:less than|below|under)\s+\$?([\d,]+)/i)
    if (lessMatch) {
      const value = parseFloat(lessMatch[1].replace(/,/g, ''))
      filters.push({
        column: 'amount',
        operator: '<',
        value
      })
    }
    
    return filters
  }
  
  private extractTimeRange(query: string): QueryIntent['timeRange'] | undefined {
    const lowerQuery = query.toLowerCase()
    const now = new Date()
    
    // Check for relative time ranges
    if (this.patterns.timeRange.thisMonth.test(query)) {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return {
        start,
        end,
        relative: 'this_month',
        // Add SQLite-friendly date strings
        startStr: start.toISOString().split('T')[0],
        endStr: end.toISOString().split('T')[0]
      }
    }
    
    if (this.patterns.timeRange.lastMonth.test(query)) {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return {
        start,
        end,
        relative: 'last_month',
        startStr: start.toISOString().split('T')[0],
        endStr: end.toISOString().split('T')[0]
      }
    }
    
    if (this.patterns.timeRange.thisQuarter.test(query)) {
      const quarter = Math.floor(now.getMonth() / 3)
      const start = new Date(now.getFullYear(), quarter * 3, 1)
      const end = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
      return {
        start,
        end,
        relative: 'this_quarter',
        startStr: start.toISOString().split('T')[0],
        endStr: end.toISOString().split('T')[0]
      }
    }
    
    if (this.patterns.timeRange.thisYear.test(query)) {
      const start = new Date(now.getFullYear(), 0, 1)
      const end = new Date(now.getFullYear(), 11, 31)
      return {
        start,
        end,
        relative: 'this_year',
        startStr: start.toISOString().split('T')[0],
        endStr: end.toISOString().split('T')[0]
      }
    }
    
    // Check for last N days
    this.patterns.timeRange.lastNDays.lastIndex = 0
    const daysMatch = this.patterns.timeRange.lastNDays.exec(query)
    if (daysMatch) {
      const days = parseInt(daysMatch[1])
      const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      return {
        start,
        end: now,
        relative: `last_${days}_days`,
        startStr: start.toISOString().split('T')[0],
        endStr: now.toISOString().split('T')[0]
      }
    }
    
    return undefined
  }
  
  private extractLimit(query: string): number | undefined {
    const match = query.match(/(?:top|bottom|first|last)\s+(\d+)/i)
    if (match) {
      return parseInt(match[1])
    }
    return undefined
  }
  
  private extractOrderBy(query: string): QueryIntent['orderBy'] | undefined {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('top') || lowerQuery.includes('highest') || lowerQuery.includes('most')) {
      return {
        column: 'amount', // Default to amount, will be refined based on context
        direction: 'DESC'
      }
    }
    
    if (lowerQuery.includes('bottom') || lowerQuery.includes('lowest') || lowerQuery.includes('least')) {
      return {
        column: 'amount',
        direction: 'ASC'
      }
    }
    
    return undefined
  }
  
  private enrichWithMetadata(intent: QueryIntent, query: string) {
    // If we have a primary entity, enrich columns based on metadata
    if (intent.entities.primary) {
      const tableMetadata = this.schemaMetadata.getTableMetadata(intent.entities.primary)
      
      // Update metrics with correct column names
      for (const metric of intent.metrics) {
        if (metric.column && metric.column !== '*') {
          const actualColumn = this.schemaMetadata.findColumnBySynonym(intent.entities.primary, metric.column)
          if (actualColumn) {
            metric.column = actualColumn
          }
        }
      }
      
      // Update dimensions with correct table if not set
      for (const dimension of intent.dimensions) {
        if (!dimension.table && intent.entities.primary) {
          dimension.table = intent.entities.primary
        }
      }
    }
  }
  
  private validateIntent(intent: QueryIntent) {
    // Ensure we have a primary entity
    if (!intent.entities.primary) {
      intent.entities.primary = 'crm_deals' // Default to deals
    }
    
    // If we have dimensions but no metrics, add COUNT
    if (intent.dimensions.length > 0 && intent.metrics.length === 0) {
      intent.metrics.push({
        name: 'count',
        aggregation: 'COUNT',
        column: '*'
      })
    }
    
    // Ensure dimension tables are set
    for (const dimension of intent.dimensions) {
      if (!dimension.table) {
        dimension.table = intent.entities.primary
      }
    }
  }
}