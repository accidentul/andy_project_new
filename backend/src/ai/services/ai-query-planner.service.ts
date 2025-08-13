import { Injectable, Logger } from '@nestjs/common'
import { openai } from '@ai-sdk/openai'
import { generateObject, generateText } from 'ai'
import { z } from 'zod'
import { SchemaIntrospectorService } from './schema-introspector/schema-introspector.service'
import { DatabaseSchema, TableSchema, RelationshipInfo } from './schema-introspector/schema.types'
import { SchemaMetadataService } from './schema-metadata.service'
import { QueryUnderstandingService } from './query-understanding.service'
import { QueryValidatorService } from './query-validator.service'
import { QueryPatternLibrary } from '../core/query-patterns'

// Schema for structured query plan output - supports complex super queries
const QueryPlanSchema = z.object({
  primaryTable: z.string().describe('The main table to query from'),
  columns: z.array(z.object({
    table: z.string(),
    column: z.string(),
    alias: z.string().optional(),
    aggregation: z.enum(['COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'GROUP_CONCAT']).optional(),
    expression: z.string().optional().describe('Complex SQL expression')
  })).describe('Columns to select - IMPORTANT: Include all columns mentioned in query'),
  joins: z.array(z.object({
    type: z.enum(['INNER', 'LEFT', 'RIGHT', 'FULL']),
    table: z.string(),
    alias: z.string().optional(),
    on: z.object({
      leftTable: z.string(),
      leftColumn: z.string(),
      rightTable: z.string(),
      rightColumn: z.string()
    })
  })).optional().describe('Tables to join'),
  conditions: z.array(z.object({
    table: z.string(),
    column: z.string(),
    operator: z.enum(['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL', 'BETWEEN', 'EXISTS', 'NOT EXISTS']),
    value: z.any().optional(),
    values: z.array(z.any()).optional(),
    subquery: z.string().optional()
  })).optional().describe('WHERE conditions'),
  groupBy: z.array(z.object({
    table: z.string(),
    column: z.string(),
    expression: z.string().optional()
  })).optional().describe('GROUP BY columns - CRITICAL: Add when query asks for "by", "grouped by", or "for each"'),
  having: z.array(z.object({
    aggregation: z.string(),
    operator: z.enum(['=', '!=', '<', '>', '<=', '>=']),
    value: z.any()
  })).optional().describe('HAVING conditions'),
  orderBy: z.array(z.object({
    table: z.string(),
    column: z.string(),
    direction: z.enum(['ASC', 'DESC'])
  })).optional().describe('ORDER BY columns'),
  limit: z.number().optional().describe('LIMIT value'),
  offset: z.number().optional().describe('OFFSET value'),
  visualization: z.enum(['table', 'pie', 'bar', 'line', 'scatter', 'heatmap', 'funnel']).optional(),
  ctes: z.array(z.object({
    name: z.string(),
    query: z.string()
  })).optional().describe('Common Table Expressions')
})

export type QueryPlan = z.infer<typeof QueryPlanSchema>

export interface QueryContext {
  tenantId: string
  userId: string
  userRole: string
  department?: string
}

@Injectable()
export class AIQueryPlannerService {
  private readonly logger = new Logger(AIQueryPlannerService.name)

  constructor(
    private schemaIntrospector: SchemaIntrospectorService,
    private schemaMetadata: SchemaMetadataService,
    private queryUnderstanding: QueryUnderstandingService,
    private queryValidator: QueryValidatorService
  ) {
    this.patternLibrary = new QueryPatternLibrary()
  }
  
  private patternLibrary: QueryPatternLibrary

  async planQuery(
    naturalLanguage: string,
    context: QueryContext
  ): Promise<QueryPlan> {
    this.logger.log(`Planning query: "${naturalLanguage}" [ENHANCED WITH SEMANTIC UNDERSTANDING]`)
    
    // Step 1: Understand the query intent
    const queryIntent = await this.queryUnderstanding.understandQuery(naturalLanguage)
    this.logger.log(`Query intent: ${JSON.stringify(queryIntent, null, 2)}`)
    
    // Step 2: DISABLED - Skip pattern matching to always use enhanced AI
    // const patternPlan = this.patternLibrary.buildQueryPlan(naturalLanguage, context)
    // if (patternPlan && patternPlan.primaryTable) {
    //   this.logger.log('Using pattern-based query plan')
    //   
    //   // Validate and correct the pattern-based plan
    //   const { plan, validation } = await this.queryValidator.validateAndCorrectQueryPlan(
    //     patternPlan as QueryPlan,
    //     context.tenantId
    //   )
    //   
    //   return plan
    // }
    
    this.logger.log('Using enhanced AI-based query planning (patterns disabled)')
    
    // Step 3: Always use AI for complex queries (JOINs, etc)
    this.logger.log('Generating AI-based query plan')
    let queryPlan = await this.generateAIPlan(naturalLanguage, queryIntent, context)
    
    // Step 5: Validate and correct the query plan
    const { plan, validation } = await this.queryValidator.validateAndCorrectQueryPlan(
      queryPlan,
      context.tenantId
    )
    
    if (validation.corrections.length > 0) {
      this.logger.log(`Applied corrections: ${validation.corrections.map(c => c.description).join(', ')}`)
    }
    
    return plan
  }
  
  private async generateAIPlan(
    naturalLanguage: string,
    queryIntent: any,
    context: QueryContext
  ): Promise<QueryPlan> {
    // Get the current database schema with business context
    const schemaDescription = await this.schemaMetadata.getSchemaWithBusinessContext()
    
    // Detect visualization type from query
    const visualizationType = this.detectVisualization(naturalLanguage)
    
    // Enhance query with explicit instructions if needed
    const enhancedQuery = this.enhanceQueryForGroupBy(naturalLanguage)
    
    // Force GROUP BY detection for certain patterns
    const forceGroupBy = this.shouldForceGroupBy(naturalLanguage)
    
    try {
      // Use AI to generate a structured query plan
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        temperature: 0.1, // Lower temperature for more deterministic output
        schema: QueryPlanSchema,
        system: `You are an expert SQL architect. Convert natural language into structured query plans for complex analytical queries.
        
Database Schema:
${schemaDescription}

CRITICAL: ALWAYS include tenantId = '${context.tenantId}' in conditions

KEY RULES FOR QUERY GENERATION:

0. JOIN DETECTION - When to use JOINs:
   - Query mentions multiple entities (e.g., "deals with account names")
   - Query asks for fields from different tables (e.g., "revenue by industry" needs deals + accounts)
   - Query says "with", "including", "and their", "by [field from other table]"
   - Examples that NEED JOINs:
     * "deals with account names" → JOIN crm_deals with crm_accounts
     * "revenue by account industry" → JOIN crm_deals with crm_accounts to get industry
     * "contacts and their activities" → JOIN crm_contacts with crm_activities
     * "deals and contacts" → JOIN crm_deals with crm_contacts
   
   JOIN relationships:
   - crm_deals.accountId → crm_accounts.id (deals belong to accounts)
   - crm_deals.contactId → crm_contacts.id (deals have contacts)
   - crm_contacts.accountId → crm_accounts.id (contacts belong to accounts)
   - crm_activities.dealId → crm_deals.id (activities on deals)
   - crm_activities.contactId → crm_contacts.id (activities with contacts)

1. GROUPING DETECTION - When to use GROUP BY:
   - Query contains "by [column]" → GROUP BY that column
   - Query contains "for each [item]" → GROUP BY that item's column
   - Query contains "per [item]" → GROUP BY that item's column
   - Query contains "grouped by" → GROUP BY specified columns
   - Query contains "distribution" → GROUP BY the distribution column
   - Query asks for aggregations with a dimension → GROUP BY the dimension

2. AGGREGATION RULES:
   - When GROUP BY is used, non-aggregated columns MUST be in GROUP BY
   - Common aggregations: COUNT(*), SUM(amount), AVG(value), MAX/MIN
   - Multiple aggregations in same query are good

3. COLUMN SELECTION:
   - When grouping, include: the grouped column + aggregation columns
   - Example: "sales by stage" → columns: [stage, COUNT(*), SUM(amount)]

4. JOIN RULES:
   - Automatically JOIN when query mentions related entities
   - Use table foreign keys to determine join conditions
   - Use LEFT JOIN for optional relationships

5. COMMON QUERY PATTERNS:

Pattern: "[metric] by [dimension]"
Example: "sales by stage", "revenue by month", "count by category"
Result: 
  columns: [{table: 'table', column: 'dimension'}, {aggregation: 'COUNT/SUM', column: 'metric'}]
  groupBy: [{table: 'table', column: 'dimension'}]

Pattern: "distribution of [entity]"
Example: "distribution of deals", "distribution of customers"
Result:
  columns: [{table: 'table', column: 'category'}, {aggregation: 'COUNT', column: '*'}]
  groupBy: [{table: 'table', column: 'category'}]

Pattern: "top N [entity] by [metric]"
Example: "top 10 deals by amount"
Result:
  columns: [all relevant columns]
  orderBy: [{column: 'metric', direction: 'DESC'}]
  limit: N

Pattern: "[entity] with [related entity]"
Example: "deals with accounts"
Result:
  joins: [{type: 'LEFT', table: 'related_table', on: {foreign_key_relationship}}]

6. SPECIFIC EXAMPLES:

Query: "Show deals with account names"
Expected QueryPlan:
{
  primaryTable: "crm_deals",
  columns: [
    {table: "crm_deals", column: "id"},
    {table: "crm_deals", column: "name"},
    {table: "crm_deals", column: "amount"},
    {table: "crm_accounts", column: "name", alias: "account_name"}
  ],
  joins: [
    {
      type: "LEFT",
      table: "crm_accounts",
      on: {
        leftTable: "crm_deals",
        leftColumn: "accountId",
        rightTable: "crm_accounts",
        rightColumn: "id"
      }
    }
  ],
  conditions: [{table: "crm_deals", column: "tenantId", operator: "=", value: "${context.tenantId}"}]
}

Query: "Revenue by account industry"
Expected QueryPlan:
{
  primaryTable: "crm_deals",
  columns: [
    {table: "crm_accounts", column: "industry"},
    {table: "crm_deals", column: "amount", aggregation: "SUM", alias: "total_revenue"}
  ],
  joins: [
    {
      type: "INNER",
      table: "crm_accounts",
      on: {
        leftTable: "crm_deals",
        leftColumn: "accountId",
        rightTable: "crm_accounts",
        rightColumn: "id"
      }
    }
  ],
  groupBy: [{table: "crm_accounts", column: "industry"}],
  conditions: [
    {table: "crm_deals", column: "tenantId", operator: "=", value: "${context.tenantId}"},
    {table: "crm_deals", column: "stage", operator: "=", value: "Closed Won"}
  ]
}

Query: "Show sales by stage"
Expected QueryPlan:
{
  primaryTable: "crm_deals",
  columns: [
    {table: "crm_deals", column: "stage"},
    {table: "crm_deals", column: "*", aggregation: "COUNT", alias: "deal_count"},
    {table: "crm_deals", column: "amount", aggregation: "SUM", alias: "total_amount"}
  ],
  groupBy: [{table: "crm_deals", column: "stage"}],
  conditions: [{table: "crm_deals", column: "tenantId", operator: "=", value: "${context.tenantId}"}]
}

Query: "Count of deals for each stage"
Expected QueryPlan:
{
  primaryTable: "crm_deals",
  columns: [
    {table: "crm_deals", column: "stage"},
    {table: "crm_deals", column: "*", aggregation: "COUNT", alias: "count"}
  ],
  groupBy: [{table: "crm_deals", column: "stage"}],
  conditions: [{table: "crm_deals", column: "tenantId", operator: "=", value: "${context.tenantId}"}]
}

IMPORTANT:
- If query asks for "by", "for each", "per" → USE GROUP BY
- If query has aggregations with dimensions → USE GROUP BY
- Don't simplify to just COUNT(*) when dimensions are mentioned`,
        prompt: enhancedQuery
      })
      
      // Add visualization type if detected
      if (visualizationType) {
        result.object.visualization = visualizationType
      }
      
      // Get the query plan
      let queryPlan = result.object
      
      // Force GROUP BY if needed and not already present
      if (forceGroupBy && (!queryPlan.groupBy || queryPlan.groupBy.length === 0)) {
        queryPlan = this.addGroupByToQueryPlan(queryPlan, naturalLanguage)
      }
      
      this.logger.log(`Query plan generated for ${queryPlan.primaryTable} with ${queryPlan.columns.length} columns`)
      if (queryPlan.groupBy && queryPlan.groupBy.length > 0) {
        this.logger.log(`GROUP BY: ${queryPlan.groupBy.map(g => `${g.table}.${g.column}`).join(', ')}`)
      }
      return queryPlan
    } catch (error) {
      this.logger.error('Failed to generate query plan', error)
      
      // Fallback to a simpler approach
      const schema = await this.schemaIntrospector.getSchema()
      return this.generateFallbackPlan(naturalLanguage, schema, context)
    }
  }

  private formatSchemaForAI(schema: DatabaseSchema): string {
    const lines: string[] = []
    
    // List all tables with their columns
    for (const [tableName, table] of schema.tables) {
      lines.push(`Table: ${tableName}`)
      lines.push('  Columns:')
      
      for (const [colName, col] of table.columns) {
        const constraints: string[] = []
        if (col.isPrimaryKey) constraints.push('PK')
        if (col.nullable) constraints.push('NULL')
        else constraints.push('NOT NULL')
        if (col.isUnique) constraints.push('UNIQUE')
        
        lines.push(`    - ${colName}: ${col.dataType} [${constraints.join(', ')}]`)
      }
      
      // List foreign keys
      if (table.foreignKeys.length > 0) {
        lines.push('  Foreign Keys:')
        for (const fk of table.foreignKeys) {
          lines.push(`    - ${fk.columnName} -> ${fk.referencedTable}.${fk.referencedColumn}`)
        }
      }
      
      lines.push('')
    }
    
    // List relationships
    if (schema.relationships.length > 0) {
      lines.push('Relationships:')
      for (const rel of schema.relationships) {
        lines.push(`  - ${rel.sourceTable}.${rel.sourceColumn} ${rel.type} ${rel.targetTable}.${rel.targetColumn}`)
      }
    }
    
    return lines.join('\n')
  }

  private enhanceQueryForGroupBy(query: string): string {
    const lowerQuery = query.toLowerCase()
    
    // Check if query needs GROUP BY enhancement
    const needsGroupBy = 
      (lowerQuery.includes(' by ') && !lowerQuery.includes('order by')) ||
      lowerQuery.includes('for each') ||
      lowerQuery.includes('each ') ||
      lowerQuery.includes('per ') ||
      lowerQuery.includes('distribution') ||
      lowerQuery.includes('breakdown') ||
      (lowerQuery.includes('show') && lowerQuery.includes('stage')) ||
      (lowerQuery.includes('count') && lowerQuery.includes('stage'))
    
    if (needsGroupBy) {
      // Make it VERY explicit for the AI
      let dimension = ''
      
      // Try to extract the dimension
      if (lowerQuery.includes('by stage')) dimension = 'stage'
      else if (lowerQuery.includes('by month')) dimension = 'month'
      else if (lowerQuery.includes('by owner')) dimension = 'owner'
      else if (lowerQuery.includes('by status')) dimension = 'status'
      else if (lowerQuery.includes('for each stage')) dimension = 'stage'
      else if (lowerQuery.includes('each stage')) dimension = 'stage'
      
      if (dimension) {
        return query + ` [IMPORTANT: This requires SELECT ${dimension}, aggregations... GROUP BY ${dimension}]`
      }
      
      return query + ' [IMPORTANT: This query needs GROUP BY clause for the dimension mentioned]'
    }
    
    return query
  }

  private detectVisualization(query: string): QueryPlan['visualization'] | undefined {
    const lowerQuery = query.toLowerCase()
    
    // Explicit chart type requests
    if (lowerQuery.includes('pie chart') || lowerQuery.includes('pie graph')) {
      return 'pie'
    }
    if (lowerQuery.includes('bar chart') || lowerQuery.includes('bar graph')) {
      return 'bar'
    }
    if (lowerQuery.includes('line chart') || lowerQuery.includes('line graph')) {
      return 'line'
    }
    if (lowerQuery.includes('scatter') || lowerQuery.includes('correlation')) {
      return 'scatter'
    }
    if (lowerQuery.includes('table') || lowerQuery.includes('list')) {
      return 'table'
    }
    
    // Implicit visualization based on query pattern
    if (lowerQuery.includes('trend') || lowerQuery.includes('over time') || lowerQuery.includes('monthly')) {
      return 'line'
    }
    if (lowerQuery.includes('distribution') || lowerQuery.includes('breakdown') || lowerQuery.includes('percentage')) {
      return 'pie'
    }
    if (lowerQuery.includes('comparison') || lowerQuery.includes('by') || lowerQuery.includes('per')) {
      return 'bar'
    }
    
    return undefined
  }

  private generateFallbackPlan(
    query: string,
    schema: DatabaseSchema,
    context: QueryContext
  ): QueryPlan {
    const lowerQuery = query.toLowerCase()
    
    // Try to identify the main table
    let primaryTable = ''
    for (const [tableName] of schema.tables) {
      if (lowerQuery.includes(tableName.toLowerCase()) || 
          lowerQuery.includes(tableName.replace('_', ' ').toLowerCase())) {
        primaryTable = tableName
        break
      }
    }
    
    // Default to first table if none found
    if (!primaryTable && schema.tables.size > 0) {
      primaryTable = Array.from(schema.tables.keys())[0]
    }
    
    const table = schema.tables.get(primaryTable)
    if (!table) {
      throw new Error('No suitable table found for query')
    }
    
    // Build basic query plan
    const plan: QueryPlan = {
      primaryTable,
      columns: [],
      conditions: [
        {
          table: primaryTable,
          column: 'tenantId',
          operator: '=',
          value: context.tenantId
        }
      ]
    }
    
    // Add columns based on query intent
    if (lowerQuery.includes('count') || lowerQuery.includes('how many')) {
      plan.columns.push({
        table: primaryTable,
        column: '*',
        aggregation: 'COUNT',
        alias: 'count'
      })
    } else if (lowerQuery.includes('sum') || lowerQuery.includes('total')) {
      // Find numeric columns
      for (const [colName, col] of table.columns) {
        if (['integer', 'decimal', 'float', 'double'].includes(col.dataType)) {
          plan.columns.push({
            table: primaryTable,
            column: colName,
            aggregation: 'SUM',
            alias: `total_${colName}`
          })
          break
        }
      }
    } else {
      // Select all columns
      for (const [colName] of table.columns) {
        plan.columns.push({
          table: primaryTable,
          column: colName
        })
      }
    }
    
    // Add limit for "top" queries
    if (lowerQuery.includes('top')) {
      const match = lowerQuery.match(/top (\d+)/)
      plan.limit = match ? parseInt(match[1]) : 10
    }
    
    return plan
  }

  private shouldForceGroupBy(query: string): boolean {
    const lowerQuery = query.toLowerCase()
    
    // Strong indicators of GROUP BY need
    const groupByIndicators = [
      'by stage',
      'by owner',
      'by month',
      'by category',
      'by type',
      'by status',
      'for each',
      'grouped by',
      'group by',
      'per ',
      'distribution',
      'breakdown',
      'count.*by',
      'count.*for each',
      'count.*per',
      'sum.*by',
      'average.*by',
      'total.*by'
    ]
    
    return groupByIndicators.some(indicator => {
      if (indicator.includes('.*')) {
        const regex = new RegExp(indicator.replace('.*', '.*'))
        return regex.test(lowerQuery)
      }
      return lowerQuery.includes(indicator)
    })
  }
  
  private addGroupByToQueryPlan(plan: QueryPlan, query: string): QueryPlan {
    const lowerQuery = query.toLowerCase()
    
    // Try to extract the dimension to group by
    let dimensionColumn = ''
    
    if (lowerQuery.includes('by stage')) dimensionColumn = 'stage'
    else if (lowerQuery.includes('by owner')) dimensionColumn = 'owner'
    else if (lowerQuery.includes('by status')) dimensionColumn = 'status'
    else if (lowerQuery.includes('by type')) dimensionColumn = 'type'
    else if (lowerQuery.includes('by month')) dimensionColumn = 'month'
    else if (lowerQuery.includes('by category')) dimensionColumn = 'category'
    else if (lowerQuery.includes('for each stage')) dimensionColumn = 'stage'
    else if (lowerQuery.includes('for each owner')) dimensionColumn = 'owner'
    
    if (dimensionColumn) {
      // Add the dimension column to select if not already there
      const hasColumn = plan.columns.some(col => 
        col.column === dimensionColumn && !col.aggregation
      )
      
      if (!hasColumn) {
        plan.columns.unshift({
          table: plan.primaryTable,
          column: dimensionColumn
        })
      }
      
      // Add GROUP BY
      plan.groupBy = [{
        table: plan.primaryTable,
        column: dimensionColumn
      }]
      
      this.logger.log(`Forced GROUP BY on ${plan.primaryTable}.${dimensionColumn}`)
    }
    
    return plan
  }

  private buildPlanFromIntent(queryIntent: any, context: QueryContext): QueryPlan {
    const plan: QueryPlan = {
      primaryTable: queryIntent.entities.primary || 'crm_deals',
      columns: [],
      conditions: []
    }
    
    // Add metrics as columns
    for (const metric of queryIntent.metrics) {
      plan.columns.push({
        table: queryIntent.entities.primary,
        column: metric.column || '*',
        aggregation: metric.aggregation,
        alias: metric.name
      })
    }
    
    // Add dimensions as columns and GROUP BY
    if (queryIntent.dimensions.length > 0) {
      plan.groupBy = []
      
      for (const dimension of queryIntent.dimensions) {
        plan.columns.unshift({
          table: dimension.table || queryIntent.entities.primary,
          column: dimension.column
        })
        
        plan.groupBy.push({
          table: dimension.table || queryIntent.entities.primary,
          column: dimension.column
        })
      }
    }
    
    // Add filters as conditions
    for (const filter of queryIntent.filters) {
      plan.conditions?.push({
        table: queryIntent.entities.primary,
        column: filter.column,
        operator: filter.operator as any,
        value: filter.value
      })
    }
    
    // Add time range filters with SQLite-compatible date format
    if (queryIntent.timeRange) {
      if (queryIntent.timeRange.start) {
        plan.conditions?.push({
          table: queryIntent.entities.primary,
          column: 'closeDate',
          operator: '>=',
          value: queryIntent.timeRange.startStr || queryIntent.timeRange.start.toISOString().split('T')[0]
        })
      }
      if (queryIntent.timeRange.end) {
        plan.conditions?.push({
          table: queryIntent.entities.primary,
          column: 'closeDate',
          operator: '<=',
          value: queryIntent.timeRange.endStr || queryIntent.timeRange.end.toISOString().split('T')[0]
        })
      }
    }
    
    // Add ordering
    if (queryIntent.orderBy) {
      plan.orderBy = [{
        table: queryIntent.entities.primary,
        column: queryIntent.orderBy.column,
        direction: queryIntent.orderBy.direction
      }]
    }
    
    // Add limit
    if (queryIntent.limit) {
      plan.limit = queryIntent.limit
    }
    
    // Add tenant filter
    plan.conditions?.push({
      table: queryIntent.entities.primary,
      column: 'tenantId',
      operator: '=',
      value: context.tenantId
    })
    
    return plan
  }

  async explainPlan(plan: QueryPlan): Promise<string> {
    const explanations: string[] = []
    
    explanations.push(`Query will select from table: ${plan.primaryTable}`)
    
    if (plan.columns.length > 0) {
      const columnDescriptions = plan.columns.map(col => {
        if (col.aggregation) {
          return `${col.aggregation}(${col.table}.${col.column})${col.alias ? ` as ${col.alias}` : ''}`
        }
        return `${col.table}.${col.column}${col.alias ? ` as ${col.alias}` : ''}`
      })
      explanations.push(`Selecting columns: ${columnDescriptions.join(', ')}`)
    }
    
    if (plan.joins && plan.joins.length > 0) {
      for (const join of plan.joins) {
        explanations.push(
          `${join.type} JOIN ${join.table} ON ${join.on.leftTable}.${join.on.leftColumn} = ${join.on.rightTable}.${join.on.rightColumn}`
        )
      }
    }
    
    if (plan.conditions && plan.conditions.length > 0) {
      const conditionDescriptions = plan.conditions.map(cond => {
        if (cond.operator === 'IN' || cond.operator === 'NOT IN') {
          return `${cond.table}.${cond.column} ${cond.operator} (${cond.values?.join(', ')})`
        }
        return `${cond.table}.${cond.column} ${cond.operator} ${cond.value ?? ''}`
      })
      explanations.push(`Filtering where: ${conditionDescriptions.join(' AND ')}`)
    }
    
    if (plan.groupBy && plan.groupBy.length > 0) {
      const groupByColumns = plan.groupBy.map(g => `${g.table}.${g.column}`)
      explanations.push(`Grouping by: ${groupByColumns.join(', ')}`)
    }
    
    if (plan.orderBy && plan.orderBy.length > 0) {
      const orderByColumns = plan.orderBy.map(o => `${o.table}.${o.column} ${o.direction}`)
      explanations.push(`Ordering by: ${orderByColumns.join(', ')}`)
    }
    
    if (plan.limit) {
      explanations.push(`Limiting to ${plan.limit} rows`)
    }
    
    if (plan.visualization) {
      explanations.push(`Results will be displayed as: ${plan.visualization} chart`)
    }
    
    return explanations.join('\n')
  }
}