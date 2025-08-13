import { z } from 'zod'
import { BaseTool, ToolContext, ToolResult } from '../base.tool'
import { DataSource } from 'typeorm'
import { InjectDataSource } from '@nestjs/typeorm'
import { Injectable } from '@nestjs/common'
import { AIQueryPlannerService } from '../../services/ai-query-planner.service'
import { DynamicSQLBuilder } from '../../core/dynamic-sql-builder'
import { SchemaIntrospectorService } from '../../services/schema-introspector/schema-introspector.service'

@Injectable()
export class DynamicAnalyticsTool extends BaseTool {
  name = 'dynamic_analytics'
  description = 'Execute intelligent analytical queries across any database schema using AI-powered query planning'
  parameters = z.object({
    query: z.string().describe('Natural language query to analyze'),
    visualize: z.boolean().optional().default(false),
    includeRawData: z.boolean().optional().default(false),
  })

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private queryPlanner: AIQueryPlannerService,
    private sqlBuilder: DynamicSQLBuilder,
    private schemaIntrospector: SchemaIntrospectorService
  ) {
    super()
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { query, visualize, includeRawData } = params

    console.log('[DynamicAnalyticsTool] Starting execution with query:', query)
    console.log('[DynamicAnalyticsTool] Context:', { 
      tenantId: context.tenantId, 
      userId: context.userId, 
      role: context.userRole 
    })

    try {
      // Step 1: Generate query plan using AI
      const queryPlan = await this.queryPlanner.planQuery(query, {
        tenantId: context.tenantId,
        userId: context.userId,
        userRole: context.userRole,
        department: context.department
      })

      console.log('[DynamicAnalyticsTool] Query plan generated:', JSON.stringify(queryPlan, null, 2))

      // Step 2: Build SQL from query plan
      const sqlResult = await this.sqlBuilder.buildSQL(queryPlan)

      console.log('[DynamicAnalyticsTool] Generated SQL:', sqlResult.sql)
      console.log('[DynamicAnalyticsTool] Parameters:', sqlResult.parameters)

      // Step 3: Execute the query
      const results = await this.dataSource.query(sqlResult.sql, sqlResult.parameters)
      
      console.log('[DynamicAnalyticsTool] Query returned', results.length, 'rows')

      // Step 4: Process results
      const processedData = this.processResults(results, queryPlan)
      
      // Step 5: Generate insights
      const insights = this.generateInsights(results, queryPlan, query)
      
      // Step 6: Prepare visualization data
      let visualizationData = null
      if (sqlResult.visualization || visualize) {
        visualizationData = this.prepareVisualizationData(
          results, 
          sqlResult.visualization || this.detectVisualizationType(queryPlan, query)
        )
        console.log('[DynamicAnalyticsTool] Generated visualization:', visualizationData)
      }

      const summaryData = this.generateSummary(results, queryPlan)
      console.log('[DynamicAnalyticsTool] Summary:', summaryData)
      
      // Step 7: Explain the query plan (for transparency)
      const planExplanation = await this.queryPlanner.explainPlan(queryPlan)
      
      return {
        success: true,
        data: {
          results: includeRawData ? results : processedData,
          summary: summaryData,
          insights,
          visualization: visualizationData,
          query: {
            natural: query,
            sql: sqlResult.sql,
            plan: queryPlan,
            explanation: planExplanation
          }
        },
        message: `Analyzed ${results.length} records using ${queryPlan.columns.length} columns`
      }
    } catch (error) {
      console.error('[DynamicAnalyticsTool] Error:', error)
      
      // Provide helpful error message
      if (error instanceof Error) {
        if (error.message.includes('column') || error.message.includes('table')) {
          // Schema-related error - refresh schema and retry
          console.log('[DynamicAnalyticsTool] Schema error detected, refreshing schema...')
          await this.schemaIntrospector.refreshSchema()
          
          return {
            success: false,
            error: `Database schema issue: ${error.message}. Please try again.`
          }
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute dynamic analysis'
      }
    }
  }

  private processResults(results: any[], queryPlan: any): any {
    if (results.length === 0) return []

    // Check if this is an aggregation query
    const hasAggregations = queryPlan.columns.some((col: any) => col.aggregation)
    
    if (hasAggregations) {
      // Format aggregated results
      return results.map(row => {
        const formatted: any = {}
        
        Object.keys(row).forEach(key => {
          // Format numeric values
          if (typeof row[key] === 'number') {
            if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('value') || key.toLowerCase().includes('revenue')) {
              formatted[this.formatFieldName(key)] = `$${row[key].toLocaleString()}`
            } else if (key.toLowerCase().includes('percent') || key.toLowerCase().includes('rate')) {
              formatted[this.formatFieldName(key)] = `${row[key].toFixed(1)}%`
            } else {
              formatted[this.formatFieldName(key)] = row[key].toLocaleString()
            }
          } else {
            formatted[this.formatFieldName(key)] = row[key]
          }
        })
        
        return formatted
      })
    } else {
      // Return detailed records (limit to 100 for performance)
      return results.slice(0, 100)
    }
  }

  private generateSummary(results: any[], queryPlan: any): any {
    const summary: any = {
      recordCount: results.length,
      columnsSelected: queryPlan.columns.length,
      tablesUsed: this.getTablesUsed(queryPlan),
      hasAggregations: queryPlan.columns.some((col: any) => col.aggregation),
      hasJoins: queryPlan.joins && queryPlan.joins.length > 0
    }

    if (results.length > 0) {
      const firstRow = results[0]
      
      // Add key metrics to summary
      Object.keys(firstRow).forEach(key => {
        const lowerKey = key.toLowerCase()
        if (lowerKey.includes('total') || lowerKey.includes('sum') || 
            lowerKey.includes('count') || lowerKey.includes('avg') || 
            lowerKey.includes('max') || lowerKey.includes('min')) {
          summary[key] = firstRow[key]
        }
      })
    }

    return summary
  }

  private generateInsights(results: any[], queryPlan: any, query: string): string[] {
    const insights: string[] = []

    if (results.length === 0) {
      insights.push('No data found matching your criteria')
      return insights
    }

    // Analyze aggregated data for patterns
    if (queryPlan.columns.some((col: any) => col.aggregation) && results.length > 1) {
      // Find significant variations
      const numericColumns = Object.keys(results[0]).filter(key => 
        typeof results[0][key] === 'number'
      )
      
      for (const col of numericColumns) {
        const values = results.map(r => r[col]).filter(v => v != null)
        if (values.length > 0) {
          const max = Math.max(...values)
          const min = Math.min(...values)
          const avg = values.reduce((a, b) => a + b, 0) / values.length
          
          if (max > avg * 2) {
            insights.push(`High variance in ${this.formatFieldName(col)}: maximum is ${(max/avg).toFixed(1)}x the average`)
          }
          
          if (min < avg * 0.5 && min !== 0) {
            insights.push(`Some ${this.formatFieldName(col)} values are significantly below average`)
          }
        }
      }
    }

    // Time-based insights
    const timeColumns = queryPlan.columns.filter((col: any) => 
      col.column.toLowerCase().includes('date') || 
      col.column.toLowerCase().includes('time') ||
      col.column.toLowerCase().includes('month')
    )
    
    if (timeColumns.length > 0 && results.length > 1) {
      // Check for trends
      const firstValue = results[0][Object.keys(results[0])[1]] // Assuming second column is a metric
      const lastValue = results[results.length - 1][Object.keys(results[0])[1]]
      
      if (typeof firstValue === 'number' && typeof lastValue === 'number') {
        const change = ((lastValue - firstValue) / firstValue) * 100
        if (Math.abs(change) > 10) {
          insights.push(`${change > 0 ? 'Growth' : 'Decline'} detected: ${Math.abs(change).toFixed(1)}% change from start to end`)
        }
      }
    }

    // Count-based insights
    if (results.length > 10) {
      insights.push(`Found ${results.length} matching records across your criteria`)
    }

    return insights
  }

  private prepareVisualizationData(results: any[], visualizationType: string): any {
    switch (visualizationType) {
      case 'pie':
        return {
          type: 'pie',
          data: results.map(r => ({
            label: r[Object.keys(r)[0]], // First field as label
            value: r[Object.keys(r)[1]] || r.count || r.total || 0 // Second field or common aggregates
          }))
        }
      
      case 'bar':
        return {
          type: 'bar',
          data: results.map(r => ({
            category: r[Object.keys(r)[0]],
            value: r[Object.keys(r)[1]] || r.count || r.total || 0
          }))
        }
      
      case 'line':
        // For time series data
        return {
          type: 'line',
          data: results.map(r => ({
            x: r[Object.keys(r)[0]], // Typically a date/time field
            y: r[Object.keys(r)[1]] || r.value || r.total || 0
          }))
        }
      
      case 'scatter':
        // For correlation data
        const xKey = Object.keys(results[0])[0]
        const yKey = Object.keys(results[0])[1]
        return {
          type: 'scatter',
          data: results.map(r => ({
            x: r[xKey],
            y: r[yKey],
            label: r[Object.keys(r)[2]] || 'Point'
          }))
        }
      
      case 'table':
      default:
        return {
          type: 'table',
          data: results,
          columns: Object.keys(results[0] || {})
        }
    }
  }

  private detectVisualizationType(queryPlan: any, query: string): string {
    const lowerQuery = query.toLowerCase()
    
    // Check for explicit chart mentions
    if (lowerQuery.includes('pie')) return 'pie'
    if (lowerQuery.includes('bar')) return 'bar'
    if (lowerQuery.includes('line')) return 'line'
    if (lowerQuery.includes('scatter')) return 'scatter'
    if (lowerQuery.includes('table') || lowerQuery.includes('list')) return 'table'
    
    // Infer from query structure
    const hasTimeColumn = queryPlan.columns.some((col: any) => 
      col.column.toLowerCase().includes('date') || 
      col.column.toLowerCase().includes('month') ||
      col.column.toLowerCase().includes('year')
    )
    
    const hasAggregation = queryPlan.columns.some((col: any) => col.aggregation)
    const hasGroupBy = queryPlan.groupBy && queryPlan.groupBy.length > 0
    
    if (hasTimeColumn && hasAggregation) {
      return 'line' // Time series data
    }
    
    if (hasGroupBy && hasAggregation) {
      const groupCount = queryPlan.groupBy.length
      if (groupCount === 1) {
        // Single grouping - check if it's categorical
        const groupColumn = queryPlan.groupBy[0].column.toLowerCase()
        if (groupColumn.includes('stage') || groupColumn.includes('status') || 
            groupColumn.includes('type') || groupColumn.includes('category')) {
          return 'pie' // Distribution data
        }
        return 'bar' // Comparison data
      }
    }
    
    return 'table' // Default to table
  }

  private formatFieldName(field: string): string {
    return field
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^./, str => str.toUpperCase())
  }

  private getTablesUsed(queryPlan: any): string[] {
    const tables = [queryPlan.primaryTable]
    
    if (queryPlan.joins) {
      tables.push(...queryPlan.joins.map((join: any) => join.table))
    }
    
    return [...new Set(tables)] // Remove duplicates
  }
}