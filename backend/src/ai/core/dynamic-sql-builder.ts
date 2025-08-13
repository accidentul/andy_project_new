import { Injectable, Logger } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { InjectDataSource } from '@nestjs/typeorm'
import { QueryPlan } from '../services/ai-query-planner.service'
import { DatabaseType } from '../services/schema-introspector/schema.types'

export interface SQLResult {
  sql: string
  parameters: any[]
  visualization?: 'table' | 'pie' | 'bar' | 'line' | 'scatter' | 'heatmap' | 'funnel'
}

interface SQLDialect {
  quoteIdentifier(identifier: string): string
  formatDate(date: Date): string
  getCurrentTimestamp(): string
  getDateFunction(func: 'year' | 'month' | 'day', column: string): string
  getStringConcat(...args: string[]): string
  getLimitClause(limit: number, offset?: number): string
  supportsCTE(): boolean
  supportsReturning(): boolean
}

@Injectable()
export class DynamicSQLBuilder {
  private readonly logger = new Logger(DynamicSQLBuilder.name)
  private dialect: SQLDialect
  private databaseType: DatabaseType

  constructor(@InjectDataSource() private dataSource: DataSource) {
    this.databaseType = dataSource.options.type as DatabaseType
    this.dialect = this.createDialect(this.databaseType)
  }

  private createDialect(type: DatabaseType): SQLDialect {
    switch (type) {
      case 'postgres':
        return new PostgreSQLDialect()
      case 'mysql':
      case 'mariadb':
        return new MySQLDialect()
      case 'sqlite':
        return new SQLiteDialect()
      case 'mssql':
        return new MSSQLDialect()
      default:
        // Default to ANSI SQL
        return new ANSISQLDialect()
    }
  }

  buildSQL(plan: QueryPlan): SQLResult {
    const parameters: any[] = []
    let parameterIndex = 1
    
    // Create table alias mapping
    const tableAliases = this.createTableAliases(plan)
    
    // Build CTEs if present
    const cteClause = this.buildCTEClause(plan)
    
    // Build SELECT clause
    const selectClause = this.buildSelectClause(plan, tableAliases)
    
    // Build FROM clause
    const fromClause = this.buildFromClause(plan, tableAliases)
    
    // Build JOIN clauses
    const joinClauses = this.buildJoinClauses(plan, tableAliases)
    
    // Build WHERE clause
    const { clause: whereClause, params: whereParams } = this.buildWhereClause(
      plan,
      parameterIndex,
      tableAliases
    )
    parameters.push(...whereParams)
    parameterIndex += whereParams.length
    
    // Build GROUP BY clause
    const groupByClause = this.buildGroupByClause(plan, tableAliases)
    
    // Build HAVING clause
    const { clause: havingClause, params: havingParams } = this.buildHavingClause(
      plan,
      parameterIndex,
      tableAliases
    )
    parameters.push(...havingParams)
    parameterIndex += havingParams.length
    
    // Build ORDER BY clause
    const orderByClause = this.buildOrderByClause(plan, tableAliases)
    
    // Build LIMIT clause
    const limitClause = this.buildLimitClause(plan)
    
    // Assemble the complete SQL
    const mainQueryParts = [
      selectClause,
      fromClause,
      ...joinClauses,
      whereClause,
      groupByClause,
      havingClause,
      orderByClause,
      limitClause
    ].filter(part => part.length > 0)
    
    const mainQuery = mainQueryParts.join('\n')
    const sql = cteClause ? `${cteClause}\n${mainQuery}` : mainQuery
    
    this.logger.debug(`Generated SQL: ${sql}`)
    this.logger.debug(`Parameters: ${JSON.stringify(parameters)}`)
    
    return {
      sql,
      parameters,
      visualization: plan.visualization
    }
  }

  private createTableAliases(plan: QueryPlan): Map<string, string> {
    const aliases = new Map<string, string>()
    const usedAliases = new Set<string>()
    
    // Primary table gets unique alias based on table name
    const primaryAlias = this.getUniqueAlias(plan.primaryTable, usedAliases, 'd')
    aliases.set(plan.primaryTable, primaryAlias)
    usedAliases.add(primaryAlias)
    
    // Join tables get unique aliases
    if (plan.joins) {
      let tableIndex = 2
      for (const join of plan.joins) {
        if (!aliases.has(join.table)) {
          const alias = join.alias || this.getUniqueAlias(join.table, usedAliases, `t${tableIndex++}`)
          aliases.set(join.table, alias)
          usedAliases.add(alias)
        }
      }
    }
    
    return aliases
  }
  
  private getUniqueAlias(tableName: string, usedAliases: Set<string>, fallback: string): string {
    // For CRM tables, use meaningful prefixes
    const aliasMap: Record<string, string> = {
      'crm_deals': 'd',
      'crm_accounts': 'a',
      'crm_contacts': 'c',
      'crm_activities': 'act',
      'connectors': 'con',
      'users': 'u',
      'roles': 'r'
    }
    
    const preferredAlias = aliasMap[tableName]
    if (preferredAlias && !usedAliases.has(preferredAlias)) {
      return preferredAlias
    }
    
    // Try table initials
    const parts = tableName.split('_')
    let alias = parts.map(p => p[0]).join('').toLowerCase()
    if (alias && !usedAliases.has(alias)) {
      return alias
    }
    
    // Use fallback
    return fallback
  }

  private buildCTEClause(plan: QueryPlan): string {
    if (!plan.ctes || plan.ctes.length === 0) {
      return ''
    }
    
    const ctes = plan.ctes.map(cte => 
      `${this.dialect.quoteIdentifier(cte.name)} AS (${cte.query})`
    )
    
    return `WITH ${ctes.join(', ')}`
  }

  private buildSelectClause(plan: QueryPlan, tableAliases: Map<string, string>): string {
    if (plan.columns.length === 0) {
      return 'SELECT *'
    }
    
    const columns = plan.columns.map(col => {
      // Handle complex expressions
      if (col.expression) {
        return col.alias ? 
          `${col.expression} AS ${this.dialect.quoteIdentifier(col.alias)}` : 
          col.expression
      }
      
      // Special handling for * in aggregations
      if (col.aggregation && col.column === '*') {
        const aggregated = `${col.aggregation}(*)`
        return col.alias ? `${aggregated} AS ${this.dialect.quoteIdentifier(col.alias)}` : aggregated
      }
      
      const tableAlias = col.table ? tableAliases.get(col.table) || col.table : null
      const tablePrefix = tableAlias ? `${this.dialect.quoteIdentifier(tableAlias)}.` : ''
      const columnName = col.column === '*' ? '*' : this.dialect.quoteIdentifier(col.column)
      const fullColumn = `${tablePrefix}${columnName}`
      
      if (col.aggregation) {
        const aggregated = `${col.aggregation}(${fullColumn})`
        return col.alias ? `${aggregated} AS ${this.dialect.quoteIdentifier(col.alias)}` : aggregated
      }
      
      return col.alias ? 
        `${fullColumn} AS ${this.dialect.quoteIdentifier(col.alias)}` : 
        fullColumn
    })
    
    return `SELECT ${columns.join(', ')}`
  }

  private buildFromClause(plan: QueryPlan, tableAliases: Map<string, string>): string {
    const table = this.dialect.quoteIdentifier(plan.primaryTable)
    const alias = tableAliases.get(plan.primaryTable) || 't'
    return `FROM ${table} AS ${this.dialect.quoteIdentifier(alias)}`
  }

  private buildJoinClauses(plan: QueryPlan, tableAliases: Map<string, string>): string[] {
    if (!plan.joins || plan.joins.length === 0) {
      return []
    }
    
    return plan.joins.map(join => {
      const table = this.dialect.quoteIdentifier(join.table)
      const alias = tableAliases.get(join.table) || 'j'
      
      const leftAlias = tableAliases.get(join.on.leftTable) || join.on.leftTable
      const rightAlias = tableAliases.get(join.on.rightTable) || join.on.rightTable
      
      const leftSide = `${this.dialect.quoteIdentifier(leftAlias)}.${this.dialect.quoteIdentifier(join.on.leftColumn)}`
      const rightSide = `${this.dialect.quoteIdentifier(rightAlias)}.${this.dialect.quoteIdentifier(join.on.rightColumn)}`
      
      return `${join.type} JOIN ${table} AS ${this.dialect.quoteIdentifier(alias)} ON ${leftSide} = ${rightSide}`
    })
  }

  private buildWhereClause(
    plan: QueryPlan,
    startParamIndex: number,
    tableAliases: Map<string, string>
  ): { clause: string; params: any[] } {
    if (!plan.conditions || plan.conditions.length === 0) {
      return { clause: '', params: [] }
    }
    
    const params: any[] = []
    let paramIndex = startParamIndex
    
    const conditions = plan.conditions.map(cond => {
      const tableAlias = tableAliases.get(cond.table) || cond.table
      const column = `${this.dialect.quoteIdentifier(tableAlias)}.${this.dialect.quoteIdentifier(cond.column)}`
      
      switch (cond.operator) {
        case 'IS NULL':
        case 'IS NOT NULL':
          return `${column} ${cond.operator}`
        
        case 'IN':
        case 'NOT IN':
          if (cond.subquery) {
            return `${column} ${cond.operator} (${cond.subquery})`
          }
          if (!cond.values || cond.values.length === 0) {
            return '1=0' // Always false for empty IN
          }
          const placeholders = cond.values.map(() => {
            const placeholder = this.getParameterPlaceholder(paramIndex++)
            params.push(cond.values)
            return placeholder
          }).join(', ')
          return `${column} ${cond.operator} (${placeholders})`
        
        case 'EXISTS':
        case 'NOT EXISTS':
          if (cond.subquery) {
            return `${cond.operator} (${cond.subquery})`
          }
          return '1=1' // Fallback
        
        case 'BETWEEN':
          if (Array.isArray(cond.value) && cond.value.length === 2) {
            const param1 = this.getParameterPlaceholder(paramIndex++)
            const param2 = this.getParameterPlaceholder(paramIndex++)
            params.push(cond.value[0], cond.value[1])
            return `${column} BETWEEN ${param1} AND ${param2}`
          }
          return '1=1' // Always true if invalid BETWEEN
        
        case 'LIKE':
          const likeParam = this.getParameterPlaceholder(paramIndex++)
          params.push(cond.value)
          return `${column} ${cond.operator} ${likeParam}`
        
        default:
          const param = this.getParameterPlaceholder(paramIndex++)
          params.push(cond.value)
          return `${column} ${cond.operator} ${param}`
      }
    })
    
    return {
      clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params
    }
  }

  private buildGroupByClause(plan: QueryPlan, tableAliases: Map<string, string>): string {
    if (!plan.groupBy || plan.groupBy.length === 0) {
      // Check if we have aggregations without GROUP BY
      const hasAggregation = plan.columns.some(col => col.aggregation)
      const nonAggregatedColumns = plan.columns.filter(col => !col.aggregation && col.column !== '*')
      
      if (hasAggregation && nonAggregatedColumns.length > 0) {
        // Auto-generate GROUP BY for non-aggregated columns
        const groupByColumns = nonAggregatedColumns.map(col => {
          const tableAlias = tableAliases.get(col.table) || col.table
          return `${this.dialect.quoteIdentifier(tableAlias)}.${this.dialect.quoteIdentifier(col.column)}`
        })
        return `GROUP BY ${groupByColumns.join(', ')}`
      }
      
      return ''
    }
    
    const columns = plan.groupBy.map(group => {
      if (group.expression) {
        return group.expression
      }
      const tableAlias = tableAliases.get(group.table) || group.table
      return `${this.dialect.quoteIdentifier(tableAlias)}.${this.dialect.quoteIdentifier(group.column)}`
    })
    
    return `GROUP BY ${columns.join(', ')}`
  }

  private buildHavingClause(
    plan: QueryPlan,
    startParamIndex: number,
    tableAliases: Map<string, string>
  ): { clause: string; params: any[] } {
    if (!plan.having || plan.having.length === 0) {
      return { clause: '', params: [] }
    }
    
    const params: any[] = []
    let paramIndex = startParamIndex
    
    const conditions = plan.having.map(cond => {
      const param = this.getParameterPlaceholder(paramIndex++)
      params.push(cond.value)
      return `${cond.aggregation} ${cond.operator} ${param}`
    })
    
    return {
      clause: `HAVING ${conditions.join(' AND ')}`,
      params
    }
  }


  private buildOrderByClause(plan: QueryPlan, tableAliases: Map<string, string>): string {
    if (!plan.orderBy || plan.orderBy.length === 0) {
      return ''
    }
    
    const columns = plan.orderBy.map(order => {
      const tableAlias = tableAliases.get(order.table) || order.table
      return `${this.dialect.quoteIdentifier(tableAlias)}.${this.dialect.quoteIdentifier(order.column)} ${order.direction}`
    })
    
    return `ORDER BY ${columns.join(', ')}`
  }

  private buildLimitClause(plan: QueryPlan): string {
    if (!plan.limit) {
      return ''
    }
    
    return this.dialect.getLimitClause(plan.limit, plan.offset)
  }

  private getParameterPlaceholder(index: number): string {
    switch (this.databaseType) {
      case 'postgres':
        return `$${index}`
      case 'mysql':
      case 'mariadb':
      case 'sqlite':
        return '?'
      case 'mssql':
        return `@p${index}`
      default:
        return '?'
    }
  }
}

// Dialect implementations
class PostgreSQLDialect implements SQLDialect {
  quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`
  }
  
  formatDate(date: Date): string {
    return date.toISOString()
  }
  
  getCurrentTimestamp(): string {
    return 'CURRENT_TIMESTAMP'
  }
  
  getDateFunction(func: 'year' | 'month' | 'day', column: string): string {
    return `EXTRACT(${func.toUpperCase()} FROM ${column})`
  }
  
  getStringConcat(...args: string[]): string {
    return args.join(' || ')
  }
  
  getLimitClause(limit: number, offset?: number): string {
    let clause = `LIMIT ${limit}`
    if (offset) {
      clause += ` OFFSET ${offset}`
    }
    return clause
  }
  
  supportsCTE(): boolean {
    return true
  }
  
  supportsReturning(): boolean {
    return true
  }
}

class MySQLDialect implements SQLDialect {
  quoteIdentifier(identifier: string): string {
    return `\`${identifier.replace(/`/g, '``')}\``
  }
  
  formatDate(date: Date): string {
    return date.toISOString().slice(0, 19).replace('T', ' ')
  }
  
  getCurrentTimestamp(): string {
    return 'CURRENT_TIMESTAMP'
  }
  
  getDateFunction(func: 'year' | 'month' | 'day', column: string): string {
    return `${func.toUpperCase()}(${column})`
  }
  
  getStringConcat(...args: string[]): string {
    return `CONCAT(${args.join(', ')})`
  }
  
  getLimitClause(limit: number, offset?: number): string {
    if (offset) {
      return `LIMIT ${offset}, ${limit}`
    }
    return `LIMIT ${limit}`
  }
  
  supportsCTE(): boolean {
    return true // MySQL 8.0+
  }
  
  supportsReturning(): boolean {
    return false
  }
}

class SQLiteDialect implements SQLDialect {
  quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`
  }
  
  formatDate(date: Date): string {
    return date.toISOString()
  }
  
  getCurrentTimestamp(): string {
    return "datetime('now')"
  }
  
  getDateFunction(func: 'year' | 'month' | 'day', column: string): string {
    switch (func) {
      case 'year':
        return `strftime('%Y', ${column})`
      case 'month':
        return `strftime('%m', ${column})`
      case 'day':
        return `strftime('%d', ${column})`
    }
  }
  
  getStringConcat(...args: string[]): string {
    return args.join(' || ')
  }
  
  getLimitClause(limit: number, offset?: number): string {
    let clause = `LIMIT ${limit}`
    if (offset) {
      clause += ` OFFSET ${offset}`
    }
    return clause
  }
  
  supportsCTE(): boolean {
    return true
  }
  
  supportsReturning(): boolean {
    return true // SQLite 3.35.0+
  }
}

class MSSQLDialect implements SQLDialect {
  quoteIdentifier(identifier: string): string {
    return `[${identifier.replace(/\]/g, ']]')}]`
  }
  
  formatDate(date: Date): string {
    return date.toISOString()
  }
  
  getCurrentTimestamp(): string {
    return 'GETDATE()'
  }
  
  getDateFunction(func: 'year' | 'month' | 'day', column: string): string {
    return `DATEPART(${func}, ${column})`
  }
  
  getStringConcat(...args: string[]): string {
    return `CONCAT(${args.join(', ')})`
  }
  
  getLimitClause(limit: number, offset?: number): string {
    // SQL Server uses OFFSET FETCH
    let clause = ''
    if (offset) {
      clause = `OFFSET ${offset} ROWS `
    } else {
      clause = `OFFSET 0 ROWS `
    }
    clause += `FETCH NEXT ${limit} ROWS ONLY`
    return clause
  }
  
  supportsCTE(): boolean {
    return true
  }
  
  supportsReturning(): boolean {
    return true // Using OUTPUT clause
  }
}

class ANSISQLDialect implements SQLDialect {
  quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`
  }
  
  formatDate(date: Date): string {
    return date.toISOString()
  }
  
  getCurrentTimestamp(): string {
    return 'CURRENT_TIMESTAMP'
  }
  
  getDateFunction(func: 'year' | 'month' | 'day', column: string): string {
    return `EXTRACT(${func.toUpperCase()} FROM ${column})`
  }
  
  getStringConcat(...args: string[]): string {
    return args.join(' || ')
  }
  
  getLimitClause(limit: number, offset?: number): string {
    // ANSI SQL:2008 standard
    let clause = ''
    if (offset) {
      clause = `OFFSET ${offset} ROWS `
    }
    clause += `FETCH FIRST ${limit} ROWS ONLY`
    return clause
  }
  
  supportsCTE(): boolean {
    return true
  }
  
  supportsReturning(): boolean {
    return false
  }
}