import { z } from 'zod'
import { BaseTool, ToolContext, ToolResult } from '../base.tool'
import { DataSource } from 'typeorm'
import { SQLQueryBuilder } from '../../core/sql-query-builder'
import { QueryAnalyzer } from '../../core/query-analyzer'

export class CrossTableAnalyticsTool extends BaseTool {
  name = 'cross_table_analytics'
  description = 'Execute complex analytical queries across multiple tables with JOINs and aggregations'
  parameters = z.object({
    query: z.string().describe('Natural language query to analyze'),
    visualize: z.boolean().optional().default(false),
    includeRawData: z.boolean().optional().default(false),
  })

  private queryBuilder: SQLQueryBuilder
  private queryAnalyzer: QueryAnalyzer

  constructor() {
    super()
    this.queryBuilder = new SQLQueryBuilder()
    this.queryAnalyzer = new QueryAnalyzer()
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { query, visualize, includeRawData } = params

    console.log('[CrossTableAnalyticsTool] Starting execution with query:', query)
    console.log('[CrossTableAnalyticsTool] Context:', { 
      tenantId: context.tenantId, 
      userId: context.userId, 
      role: context.userRole 
    })

    try {
      // Analyze the query
      const analysis = this.queryAnalyzer.analyze(query)
      
      // Build SQL query
      const sqlQuery = this.queryBuilder.buildQuery(query, analysis, {
        tenantId: context.tenantId,
        userId: context.userId,
        userRole: context.userRole,
        department: context.department
      })

      console.log('[CrossTableAnalyticsTool] Generated SQL:', sqlQuery.sql)
      console.log('[CrossTableAnalyticsTool] Parameters:', sqlQuery.parameters)

      // Get database connection
      const dataSource = await this.getDataSource()
      
      // Execute the query
      console.log('[CrossTableAnalyticsTool] Executing SQL:', sqlQuery.sql)
      console.log('[CrossTableAnalyticsTool] With parameters:', sqlQuery.parameters)
      const results = await dataSource.query(sqlQuery.sql, sqlQuery.parameters)
      
      console.log('[CrossTableAnalyticsTool] Query returned', results.length, 'rows')

      // Process results based on visualization type
      const processedData = this.processResults(results, sqlQuery, query)
      
      // Generate insights
      const insights = this.generateInsights(results, sqlQuery, query)
      
      // Prepare visualization data if requested or if a visualization type is detected
      let visualizationData = null
      if (sqlQuery.visualizationType && sqlQuery.visualizationType !== 'table') {
        visualizationData = this.prepareVisualizationData(results, sqlQuery.visualizationType!)
        console.log('[CrossTableAnalyticsTool] Generated visualization:', visualizationData)
      } else if (visualize && sqlQuery.visualizationType === 'table') {
        // For table visualization, include all columns
        visualizationData = this.prepareVisualizationData(results, 'table')
        console.log('[CrossTableAnalyticsTool] Generated table visualization:', visualizationData)
      }

      const summaryData = this.generateSummary(results, sqlQuery)
      console.log('[CrossTableAnalyticsTool] Summary:', summaryData)
      
      return {
        success: true,
        data: {
          results: includeRawData ? results : processedData,
          summary: summaryData,
          insights,
          visualization: visualizationData,
          query: {
            natural: query,
            sql: sqlQuery.sql,
            tables: sqlQuery.tables,
            aggregations: sqlQuery.aggregations
          }
        },
        message: `Analyzed ${results.length} records across ${sqlQuery.tables.length} tables`
      }
    } catch (error) {
      console.error('[CrossTableAnalyticsTool] Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute cross-table analysis'
      }
    }
  }

  private async getDataSource(): Promise<DataSource> {
    // This would typically be injected, but for now we'll create a connection
    const { DataSource } = require('typeorm')
    
    const dataSource = new DataSource({
      type: 'sqlite',
      database: process.env.DATABASE_PATH || './data/app.db',
      synchronize: false,
      logging: false
    })

    if (!dataSource.isInitialized) {
      await dataSource.initialize()
    }

    return dataSource
  }

  private processResults(results: any[], sqlQuery: any, query: string): any {
    if (results.length === 0) return []

    // Check if this is an aggregation query
    const hasAggregations = sqlQuery.aggregations.length > 0
    
    if (hasAggregations) {
      // Format aggregated results
      return results.map(row => {
        const formatted: any = {}
        
        Object.keys(row).forEach(key => {
          // Format numeric values
          if (typeof row[key] === 'number') {
            if (key.includes('amount') || key.includes('value') || key.includes('revenue')) {
              formatted[this.formatFieldName(key)] = `$${row[key].toLocaleString()}`
            } else if (key.includes('percent') || key.includes('rate')) {
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
      // Format detailed records
      return results.slice(0, 100) // Limit to 100 records for performance
    }
  }

  private generateSummary(results: any[], sqlQuery: any): any {
    const summary: any = {
      recordCount: results.length,
      tablesUsed: sqlQuery.tables,
      hasAggregations: sqlQuery.aggregations.length > 0
    }

    if (results.length > 0) {
      const firstRow = results[0]
      
      // Add aggregation results to summary
      if (firstRow.total_value !== undefined) {
        summary.totalValue = firstRow.total_value
      }
      if (firstRow.avg_value !== undefined) {
        summary.averageValue = firstRow.avg_value
      }
      if (firstRow.count !== undefined) {
        summary.totalCount = firstRow.count
      }
      if (firstRow.max_value !== undefined) {
        summary.maxValue = firstRow.max_value
      }
    }

    return summary
  }

  private generateInsights(results: any[], sqlQuery: any, query: string): string[] {
    const insights: string[] = []

    if (results.length === 0) {
      insights.push('No data found matching your criteria')
      return insights
    }

    // Analyze trends in aggregated data
    if (sqlQuery.aggregations.length > 0 && results.length > 1) {
      // Check for significant variations
      const values = results.map(r => r.total_value || r.count || 0).filter(v => v)
      if (values.length > 0) {
        const max = Math.max(...values)
        const min = Math.min(...values)
        const avg = values.reduce((a, b) => a + b, 0) / values.length
        
        if (max > avg * 2) {
          insights.push(`Significant variation detected: highest value is ${(max/avg).toFixed(1)}x the average`)
        }
        
        if (min < avg * 0.5) {
          insights.push(`Some categories are underperforming at less than 50% of average`)
        }
      }

      // Check for patterns in grouped data
      if (results[0].stage) {
        const closedWon = results.find(r => r.stage === 'Closed Won')
        const closedLost = results.find(r => r.stage === 'Closed Lost')
        
        if (closedWon && closedLost) {
          const winRate = closedWon.count / (closedWon.count + closedLost.count) * 100
          insights.push(`Win rate: ${winRate.toFixed(1)}% based on closed deals`)
        }
      }

      // Time-based insights
      if (results[0].month) {
        const sortedByMonth = [...results].sort((a, b) => a.month.localeCompare(b.month))
        const latestMonth = sortedByMonth[sortedByMonth.length - 1]
        const previousMonth = sortedByMonth[sortedByMonth.length - 2]
        
        if (latestMonth && previousMonth) {
          const growth = ((latestMonth.monthly_value - previousMonth.monthly_value) / previousMonth.monthly_value) * 100
          if (Math.abs(growth) > 10) {
            insights.push(`Month-over-month ${growth > 0 ? 'growth' : 'decline'}: ${Math.abs(growth).toFixed(1)}%`)
          }
        }
      }
    }

    // Insights for detailed records
    if (sqlQuery.aggregations.length === 0 && results.length > 0) {
      if (results[0].amount !== undefined) {
        const amounts = results.map(r => r.amount).filter(a => a)
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
        const highValueDeals = amounts.filter(a => a > avgAmount * 1.5).length
        
        if (highValueDeals > 0) {
          insights.push(`${highValueDeals} high-value items (50%+ above average)`)
        }
      }
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
            value: r.count || r.total_value || r[Object.keys(r)[1]] // Second field as value
          }))
        }
      
      case 'bar':
        return {
          type: 'bar',
          data: results.map(r => ({
            category: r[Object.keys(r)[0]],
            value: r.count || r.total_value || r[Object.keys(r)[1]]
          }))
        }
      
      case 'line':
        // For line charts, we need to aggregate by time period
        if (results.length > 0 && (results[0].month || results[0].date)) {
          // Group by month/date and sum values
          const grouped = results.reduce((acc, r) => {
            const key = r.month || r.date || r[Object.keys(r)[0]]
            if (!acc[key]) {
              acc[key] = 0
            }
            acc[key] += r.total_value || r.monthly_value || r.amount || r.count || 0
            return acc
          }, {} as Record<string, number>)
          
          return {
            type: 'line',
            data: Object.entries(grouped).map(([label, value]) => ({
              x: label,
              y: value
            }))
          }
        }
        
        // Fallback for non-time series data
        return {
          type: 'line',
          data: results.slice(0, 20).map(r => ({
            x: r.month || r.date || r[Object.keys(r)[0]],
            y: r.total_value || r.monthly_value || r.amount || r.count || r[Object.keys(r)[1]]
          }))
        }
      
      case 'table':
        // For table visualization, include all columns
        const columns = results.length > 0 ? Object.keys(results[0]) : []
        return {
          type: 'table',
          data: results,
          columns: columns
        }
      
      case 'scatter':
        // For scatter plot, try to find two numeric columns
        if (results.length > 0) {
          const numericKeys = Object.keys(results[0]).filter(key => 
            typeof results[0][key] === 'number'
          )
          
          // Use first two numeric columns or fallback to any two columns
          const xKey = numericKeys[0] || Object.keys(results[0])[0]
          const yKey = numericKeys[1] || numericKeys[0] || Object.keys(results[0])[1]
          
          return {
            type: 'scatter',
            data: results.map(r => {
              const labelKey = Object.keys(r).find(k => typeof r[k] === 'string')
              return {
                x: r[xKey] || 0,
                y: r[yKey] || 0,
                label: labelKey ? r[labelKey] : 'Point'
              }
            })
          }
        }
        return { type: 'scatter', data: [] }
      
      default:
        return null
    }
  }

  private formatFieldName(field: string): string {
    return field
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^./, str => str.toUpperCase())
  }
}