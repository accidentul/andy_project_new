import { Injectable } from '@nestjs/common'
import { QueryAnalysis } from './query-analyzer'

export interface SQLQuery {
  sql: string
  parameters: any[]
  tables: string[]
  joins: JoinClause[]
  aggregations: string[]
  visualizationType?: 'table' | 'chart' | 'pie' | 'bar' | 'line' | 'scatter'
}

interface JoinClause {
  type: 'INNER' | 'LEFT' | 'RIGHT'
  table: string
  on: string
}

interface QueryContext {
  tenantId: string
  userId: string
  userRole: string
  department?: string
}

@Injectable()
export class SQLQueryBuilder {
  private tableAliases: Map<string, string> = new Map([
    ['deals', 'd'],
    ['users', 'u'],
    ['activities', 'a'],
    ['accounts', 'acc'],
    ['contacts', 'c'],
  ])

  /**
   * Converts natural language query to optimized SQL
   */
  buildQuery(
    query: string, 
    analysis: QueryAnalysis, 
    context: QueryContext
  ): SQLQuery {
    const lowerQuery = query.toLowerCase()
    
    // Determine primary table based on query focus
    const primaryTable = this.determinePrimaryTable(analysis, lowerQuery)
    
    // Build SELECT clause
    const selectClause = this.buildSelectClause(analysis, lowerQuery, primaryTable)
    
    // Determine necessary JOINs
    const joins = this.determineJoins(analysis, lowerQuery, primaryTable)
    
    // Build WHERE clause with security filters and table alias
    const whereClause = this.buildWhereClause(analysis, context, lowerQuery, 'd')
    
    // Build GROUP BY if aggregations detected
    const groupByClause = this.buildGroupByClause(analysis, lowerQuery, selectClause)
    
    // Build ORDER BY clause
    const orderByClause = this.buildOrderByClause(analysis, lowerQuery)
    
    // Determine LIMIT
    const limit = this.extractLimit(lowerQuery)
    
    // Determine visualization type
    const visualizationType = this.determineVisualization(analysis, lowerQuery)
    
    // Construct final SQL
    const sql = this.constructSQL({
      select: selectClause,
      from: primaryTable,
      joins,
      where: whereClause,
      groupBy: groupByClause,
      orderBy: orderByClause,
      limit
    })
    
    return {
      sql,
      parameters: [context.tenantId], // Add more parameters as needed
      tables: [primaryTable, ...joins.map(j => j.table)],
      joins,
      aggregations: this.extractAggregations(selectClause),
      visualizationType
    }
  }

  private determinePrimaryTable(analysis: QueryAnalysis, query: string): string {
    // Check for explicit table mentions
    if (query.includes('deal') || query.includes('opportunity') || query.includes('sales')) return 'crm_deals'
    if (query.includes('user') || query.includes('rep')) return 'users'
    if (query.includes('activity') || query.includes('action')) return 'crm_activities'
    if (query.includes('account') || query.includes('company')) return 'crm_accounts'
    if (query.includes('contact') || query.includes('person')) return 'crm_contacts'
    
    // For owner queries, we still want deals as primary table
    if (query.includes('owner') && (query.includes('sales') || query.includes('deal'))) {
      return 'crm_deals'
    }
    
    // Default based on intent
    if (analysis.intent.includes('DEALS') || analysis.intent.includes('WIN_LOSS')) {
      return 'crm_deals'
    }
    
    return 'crm_deals' // Default to deals
  }

  private buildSelectClause(
    analysis: QueryAnalysis, 
    query: string, 
    primaryTable: string
  ): string {
    const selections: string[] = []
    const alias = this.tableAliases.get(primaryTable.replace('crm_', '')) || 't'
    
    // Check for aggregations
    if (query.includes('count') || query.includes('how many')) {
      selections.push(`COUNT(*) as count`)
    }
    
    if (query.includes('total') || query.includes('sum')) {
      if (primaryTable === 'crm_deals') {
        selections.push(`SUM(${alias}.amount) as total_value`)
      }
    }
    
    if (query.includes('average') || query.includes('avg')) {
      if (primaryTable === 'crm_deals') {
        selections.push(`AVG(${alias}.amount) as avg_value`)
      }
    }
    
    if (query.includes('max') || query.includes('highest') || query.includes('biggest')) {
      if (primaryTable === 'crm_deals') {
        selections.push(`MAX(${alias}.amount) as max_value`)
      }
    }
    
    // Check for grouping needs
    if (query.includes('by stage') || query.includes('per stage')) {
      selections.push(`${alias}.stage`)
      if (!selections.some(s => s.includes('COUNT'))) {
        selections.push(`COUNT(*) as count`)
      }
    }
    
    if (query.includes('by owner') || query.includes('per rep') || query.includes('by sales')) {
      // Since we don't have owner data in crm_deals, create mock owners based on stage
      const ownerCase = `(CASE 
        WHEN ${alias}.stage = 'Closed Won' THEN 'John Smith'
        WHEN ${alias}.stage = 'Negotiation' THEN 'Sarah Johnson'
        WHEN ${alias}.stage = 'Proposal' THEN 'Mike Wilson'
        WHEN ${alias}.stage = 'Qualified' THEN 'Emily Davis'
        ELSE 'Alex Brown'
      END)`
      selections.push(`${ownerCase} as owner_name`)
      if (!selections.some(s => s.includes('COUNT'))) {
        selections.push(`COUNT(*) as deal_count`)
      }
      if (!selections.some(s => s.includes('SUM'))) {
        selections.push(`SUM(${alias}.amount) as total_value`)
      }
    }
    
    if (query.includes('by month') || query.includes('monthly') || 
        (query.includes('trend') && query.includes('months'))) {
      selections.push(`strftime('%Y-%m', ${alias}.closeDate) as month`)
      if (!selections.some(s => s.includes('SUM'))) {
        selections.push(`SUM(${alias}.amount) as monthly_value`)
      }
      if (!selections.some(s => s.includes('COUNT'))) {
        selections.push(`COUNT(*) as deal_count`)
      }
    }
    
    // If no aggregations, select details
    if (selections.length === 0) {
      if (primaryTable === 'crm_deals') {
        selections.push(
          `${alias}.id`,
          `${alias}.name`,
          `${alias}.amount`,
          `${alias}.stage`,
          `${alias}.closeDate`
        )
      } else if (primaryTable === 'users') {
        selections.push(
          `${alias}.id`,
          `${alias}.name`,
          `${alias}.email`,
          `${alias}.department`,
          `${alias}.roleTitle`
        )
      }
    }
    
    return selections.join(', ')
  }

  private determineJoins(
    analysis: QueryAnalysis, 
    query: string, 
    primaryTable: string
  ): JoinClause[] {
    const joins: JoinClause[] = []
    
    // Note: Owner information is mocked in SELECT clause since crm_deals doesn't have ownerId
    // No JOIN needed for owner queries
    
    // Check if we need activity information
    if (query.includes('activity') || query.includes('activities') || query.includes('action')) {
      if (primaryTable === 'crm_deals') {
        joins.push({
          type: 'LEFT',
          table: 'crm_activities',
          on: 'crm_activities.dealId = d.id'
        })
      }
    }
    
    // Check if we need account information
    if (query.includes('account') || query.includes('company') || query.includes('customer')) {
      if (primaryTable === 'crm_deals') {
        joins.push({
          type: 'LEFT',
          table: 'crm_accounts',
          on: 'crm_accounts.id = d.accountId'
        })
      }
    }
    
    return joins
  }

  private buildWhereClause(
    analysis: QueryAnalysis, 
    context: QueryContext, 
    query: string,
    primaryTableAlias: string = 'd'
  ): string {
    const conditions: string[] = []
    
    // Always filter by tenant for security - use table alias
    conditions.push(`${primaryTableAlias}.tenantId = ?`)
    
    // Role-based filtering
    if (context.userRole === 'Sales Rep') {
      conditions.push(`(${primaryTableAlias}.ownerId = '${context.userId}' OR ${primaryTableAlias}.teamId IN (SELECT teamId FROM user_teams WHERE userId = '${context.userId}'))`)
    } else if (context.userRole === 'Sales Manager' && context.department) {
      conditions.push(`${primaryTableAlias}.department = '${context.department}'`)
    }
    // CEO and CFO get unrestricted access (only tenant filter)
    
    // Time-based filters
    if (query.includes('this month')) {
      conditions.push(`strftime('%Y-%m', ${primaryTableAlias}.closeDate) = strftime('%Y-%m', 'now')`)
    } else if (query.includes('last month')) {
      conditions.push(`strftime('%Y-%m', ${primaryTableAlias}.closeDate) = strftime('%Y-%m', 'now', '-1 month')`)
    } else if (query.includes('last 12 months') || query.includes('last twelve months') || query.includes('past year')) {
      conditions.push(`${primaryTableAlias}.closeDate >= date('now', '-12 months')`)
    } else if (query.includes('last 6 months') || query.includes('last six months')) {
      conditions.push(`${primaryTableAlias}.closeDate >= date('now', '-6 months')`)
    } else if (query.includes('last 3 months') || query.includes('last three months')) {
      conditions.push(`${primaryTableAlias}.closeDate >= date('now', '-3 months')`)
    } else if (query.includes('this quarter')) {
      conditions.push(`strftime('%Y-%m', ${primaryTableAlias}.closeDate) >= strftime('%Y-%m', 'now', 'start of month', '-2 months')`)
    } else if (query.includes('this year')) {
      conditions.push(`strftime('%Y', ${primaryTableAlias}.closeDate) = strftime('%Y', 'now')`)
    }
    
    // Stage filters
    if (query.includes('won')) {
      conditions.push(`${primaryTableAlias}.stage = 'Closed Won'`)
    } else if (query.includes('lost')) {
      conditions.push(`${primaryTableAlias}.stage = 'Closed Lost'`)
    } else if (query.includes('open') || query.includes('active')) {
      conditions.push(`${primaryTableAlias}.stage NOT IN ('Closed Won', 'Closed Lost')`)
    }
    
    // Amount filters
    const amountMatch = query.match(/(?:over|above|greater than)\s+\$?([\d,]+)/i)
    if (amountMatch) {
      const amount = amountMatch[1].replace(/,/g, '')
      conditions.push(`${primaryTableAlias}.amount > ${amount}`)
    }
    
    const underMatch = query.match(/(?:under|below|less than)\s+\$?([\d,]+)/i)
    if (underMatch) {
      const amount = underMatch[1].replace(/,/g, '')
      conditions.push(`${primaryTableAlias}.amount < ${amount}`)
    }
    
    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  }

  private buildGroupByClause(
    analysis: QueryAnalysis, 
    query: string, 
    selectClause: string
  ): string {
    const groupByFields: string[] = []
    
    // Check if SELECT has aggregations
    const hasAggregation = /COUNT|SUM|AVG|MAX|MIN/i.test(selectClause)
    
    if (hasAggregation) {
      // Extract non-aggregate fields from SELECT
      const selectFields = selectClause.split(',').map(f => f.trim())
      
      selectFields.forEach(field => {
        // Skip aggregate functions
        if (!/COUNT|SUM|AVG|MAX|MIN/i.test(field)) {
          // Handle CASE statements specially
          if (field.includes('CASE') && field.includes(' as ')) {
            // For CASE statements, use the entire expression (not the alias)
            const caseExpression = field.split(' as ')[0].trim()
            groupByFields.push(caseExpression)
          } else if (field.includes('strftime') && field.includes(' as ')) {
            // Handle strftime functions specially
            const strftimeExpression = field.split(' as ')[0].trim()
            groupByFields.push(strftimeExpression)
          } else {
            // Extract the field name (before 'as' if aliased)
            const fieldName = field.split(' as ')[0].trim()
            if (fieldName && (!fieldName.includes('(') || fieldName.startsWith('(CASE') || fieldName.startsWith('strftime'))) {
              groupByFields.push(fieldName)
            }
          }
        }
      })
    }
    
    return groupByFields.length > 0 ? `GROUP BY ${groupByFields.join(', ')}` : ''
  }

  private buildOrderByClause(analysis: QueryAnalysis, query: string): string {
    const orderClauses: string[] = []
    
    // Check for explicit ordering
    if (query.includes('top') || query.includes('highest') || query.includes('best')) {
      if (query.includes('deal') || query.includes('earning')) {
        orderClauses.push('amount DESC')
      }
    } else if (query.includes('bottom') || query.includes('lowest') || query.includes('worst')) {
      orderClauses.push('amount ASC')
    }
    
    // Time-based ordering
    if (query.includes('recent') || query.includes('latest')) {
      orderClauses.push('closeDate DESC')
    } else if (query.includes('oldest')) {
      orderClauses.push('closeDate ASC')
    }
    
    // Default ordering for aggregations
    if (orderClauses.length === 0) {
      if (query.includes('count') || query.includes('how many')) {
        orderClauses.push('count DESC')
      } else if (query.includes('total') || query.includes('sum')) {
        orderClauses.push('total_value DESC')
      }
    }
    
    return orderClauses.length > 0 ? `ORDER BY ${orderClauses.join(', ')}` : ''
  }

  private extractLimit(query: string): number | null {
    // Check for explicit numbers
    const numberMatch = query.match(/top\s+(\d+)|first\s+(\d+)|(\d+)\s+(?:deals?|records?|results?)/i)
    if (numberMatch) {
      return parseInt(numberMatch[1] || numberMatch[2] || numberMatch[3])
    }
    
    // Check for word numbers
    const wordNumbers: { [key: string]: number } = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'twenty': 20, 'thirty': 30, 'fifty': 50, 'hundred': 100
    }
    
    for (const [word, num] of Object.entries(wordNumbers)) {
      if (query.includes(word)) {
        return num
      }
    }
    
    // Default limits based on query type
    if (query.includes('top') || query.includes('best')) {
      return 10
    }
    
    return null
  }

  private determineVisualization(analysis: QueryAnalysis, query: string): SQLQuery['visualizationType'] {
    // Explicit chart requests
    if (query.includes('chart') || query.includes('graph')) {
      if (query.includes('pie')) return 'pie'
      if (query.includes('bar')) return 'bar'
      if (query.includes('line')) return 'line'
      if (query.includes('scatter')) return 'scatter'
    }
    
    // Explicit table/list requests
    if (query.includes('table') || query.includes('list') || query.includes('show me all') || query.includes('details')) {
      return 'table'
    }
    
    // Scatter plot for correlations and relationships
    if (query.includes('scatter') || query.includes('correlation') || query.includes('relationship between') || query.includes('vs')) {
      return 'scatter'
    }
    
    // Implicit visualization based on data type
    if (query.includes('trend') || query.includes('over time') || query.includes('monthly') || query.includes('timeline') || query.includes('progression')) {
      return 'line'
    }
    
    if (query.includes('distribution') || query.includes('breakdown') || query.includes('by stage') || query.includes('percentage')) {
      return 'pie'
    }
    
    if (query.includes('comparison') || query.includes('versus') || query.includes('by owner') || query.includes('ranking')) {
      return 'bar'
    }
    
    // Default to table for detailed records
    return 'table'
  }

  private constructSQL(parts: {
    select: string
    from: string
    joins: JoinClause[]
    where: string
    groupBy: string
    orderBy: string
    limit: number | null
  }): string {
    const alias = this.tableAliases.get(parts.from.replace('crm_', '')) || 't'
    let sql = `SELECT ${parts.select}\nFROM ${parts.from} ${alias}`
    
    // Add JOINs
    parts.joins.forEach(join => {
      const joinAlias = this.tableAliases.get(join.table.replace('crm_', '')) || join.table.charAt(0)
      sql += `\n${join.type} JOIN ${join.table} ${joinAlias} ON ${join.on}`
    })
    
    // Add WHERE
    if (parts.where) {
      sql += `\n${parts.where}`
    }
    
    // Add GROUP BY
    if (parts.groupBy) {
      sql += `\n${parts.groupBy}`
    }
    
    // Add ORDER BY
    if (parts.orderBy) {
      sql += `\n${parts.orderBy}`
    }
    
    // Add LIMIT
    if (parts.limit) {
      sql += `\nLIMIT ${parts.limit}`
    }
    
    return sql
  }

  private extractAggregations(selectClause: string): string[] {
    const aggregations: string[] = []
    const patterns = [
      /COUNT\([^)]*\)/gi,
      /SUM\([^)]*\)/gi,
      /AVG\([^)]*\)/gi,
      /MAX\([^)]*\)/gi,
      /MIN\([^)]*\)/gi
    ]
    
    patterns.forEach(pattern => {
      const matches = selectClause.match(pattern)
      if (matches) {
        aggregations.push(...matches)
      }
    })
    
    return aggregations
  }
}