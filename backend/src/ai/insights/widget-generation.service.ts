import { Injectable, Logger } from '@nestjs/common'
import { AIQueryPlannerService } from '../services/ai-query-planner.service'
import { DynamicSQLBuilder } from '../core/dynamic-sql-builder'
import { ToolRegistry } from '../tools/tool-registry'
import { Insight } from './insights-discovery.service'
import { Forecast } from './predictive-analytics.service'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

export interface DashboardWidget {
  id: string
  type: 'metric' | 'chart' | 'table' | 'insight' | 'forecast' | 'ai-generated'
  title: string
  description?: string
  size: 'small' | 'medium' | 'large' | 'full'
  position?: { x: number; y: number }
  visualization: {
    type: 'number' | 'line' | 'bar' | 'pie' | 'table' | 'gauge' | 'heatmap' | 'scatter' | 'funnel'
    data: any
    config?: {
      colors?: string[]
      showLegend?: boolean
      showLabels?: boolean
      animate?: boolean
      refreshInterval?: number // in seconds
    }
  }
  query?: {
    natural: string
    sql?: string
    params?: any[]
  }
  actions?: {
    label: string
    icon?: string
    action: string
    params?: any
  }[]
  metadata: {
    source: 'insight' | 'forecast' | 'query' | 'manual'
    confidence?: number
    lastUpdated: Date
    refreshRate?: number
    tenantId: string
    userId?: string
    department?: string
  }
}

const WidgetConfigSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  visualizationType: z.enum(['number', 'line', 'bar', 'pie', 'table', 'gauge', 'heatmap', 'scatter', 'funnel']),
  size: z.enum(['small', 'medium', 'large', 'full']),
  metrics: z.array(z.object({
    name: z.string(),
    aggregation: z.enum(['COUNT', 'SUM', 'AVG', 'MAX', 'MIN']).optional(),
    field: z.string()
  })),
  dimensions: z.array(z.string()).optional(),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any()
  })).optional(),
  refreshInterval: z.number().optional()
})

@Injectable()
export class WidgetGenerationService {
  private readonly logger = new Logger(WidgetGenerationService.name)
  private widgetCache: Map<string, DashboardWidget[]> = new Map()

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private queryPlanner: AIQueryPlannerService,
    private sqlBuilder: DynamicSQLBuilder,
    private toolRegistry: ToolRegistry,
  ) {}

  async generateWidgetFromQuery(
    query: string,
    tenantId: string,
    userId?: string
  ): Promise<DashboardWidget> {
    this.logger.log(`Generating widget from query: "${query}"`)
    
    try {
      // Use AI to determine widget configuration
      const widgetConfig = await this.determineWidgetConfig(query)
      
      // Plan and execute the query
      const queryPlan = await this.queryPlanner.planQuery(query, {
        tenantId,
        userId: userId || 'system',
        userRole: 'admin'
      })
      
      // Build and execute SQL
      const sqlResult = this.sqlBuilder.buildSQL(queryPlan)
      const results = await this.dataSource.query(sqlResult.sql, sqlResult.parameters || [])
      
      // Transform data for visualization
      const visualizationData = this.transformDataForVisualization(
        results,
        widgetConfig.visualizationType,
        queryPlan
      )
      
      // Create the widget
      const widget: DashboardWidget = {
        id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: this.determineWidgetType(widgetConfig.visualizationType),
        title: widgetConfig.title,
        description: widgetConfig.description,
        size: widgetConfig.size,
        visualization: {
          type: widgetConfig.visualizationType,
          data: visualizationData,
          config: this.getVisualizationConfig(widgetConfig.visualizationType)
        },
        query: {
          natural: query,
          sql: sqlResult.sql,
          params: sqlResult.parameters || []
        },
        actions: this.generateWidgetActions(widgetConfig, queryPlan),
        metadata: {
          source: 'query',
          confidence: 0.85,
          lastUpdated: new Date(),
          refreshRate: widgetConfig.refreshInterval,
          tenantId,
          userId
        }
      }
      
      return widget
      
    } catch (error: any) {
      this.logger.error('Failed to generate widget from query:', error)
      
      // Return error widget
      return this.createErrorWidget(query, error?.message || 'Unknown error', tenantId)
    }
  }

  async generateWidgetFromInsight(insight: Insight): Promise<DashboardWidget> {
    this.logger.log(`Generating widget from insight: ${insight.title}`)
    
    // Determine visualization based on insight type
    const visualizationType = this.getVisualizationForInsightType(insight)
    
    // Create widget from insight data
    const widget: DashboardWidget = {
      id: `widget-insight-${insight.id}`,
      type: 'insight',
      title: insight.title,
      description: insight.description,
      size: this.determineInsightWidgetSize(insight),
      visualization: {
        type: visualizationType,
        data: insight.visualization?.data || this.formatInsightData(insight),
        config: {
          colors: this.getInsightColors(insight.severity),
          animate: true,
          showLabels: true
        }
      },
      actions: insight.actions?.map(a => ({
        label: a.label,
        action: a.action,
        params: a.params
      })),
      metadata: {
        source: 'insight',
        confidence: insight.confidence,
        lastUpdated: insight.timestamp,
        tenantId: insight.tenantId,
        department: insight.department
      }
    }
    
    return widget
  }

  async generateWidgetFromForecast(forecast: Forecast): Promise<DashboardWidget> {
    this.logger.log(`Generating widget from forecast: ${forecast.metric}`)
    
    // Format forecast data for visualization
    const chartData = forecast.predictions.map(p => ({
      date: p.date.toISOString().split('T')[0],
      value: p.value,
      upperBound: p.upperBound,
      lowerBound: p.lowerBound,
      confidence: p.confidence
    }))
    
    const widget: DashboardWidget = {
      id: `widget-forecast-${forecast.id}`,
      type: 'forecast',
      title: `${forecast.metric} Forecast`,
      description: `${forecast.period} forecast with ${(forecast.accuracy * 100).toFixed(0)}% accuracy`,
      size: 'large',
      visualization: {
        type: 'line',
        data: chartData,
        config: {
          colors: ['#3b82f6', '#10b981', '#ef4444'],
          showLegend: true,
          animate: true
        }
      },
      actions: [
        {
          label: 'View Details',
          icon: 'chart',
          action: 'viewForecastDetails',
          params: { forecastId: forecast.id }
        },
        {
          label: 'Adjust Parameters',
          icon: 'settings',
          action: 'configureForecast',
          params: { forecastId: forecast.id }
        }
      ],
      metadata: {
        source: 'forecast',
        confidence: forecast.accuracy,
        lastUpdated: forecast.generatedAt,
        tenantId: forecast.tenantId
      }
    }
    
    return widget
  }

  async generateSmartDashboard(
    tenantId: string,
    userId: string,
    role: string
  ): Promise<DashboardWidget[]> {
    this.logger.log(`Generating smart dashboard for ${role} user`)
    
    const widgets: DashboardWidget[] = []
    
    // Generate role-specific widgets
    const roleWidgets = await this.generateRoleSpecificWidgets(role, tenantId, userId)
    widgets.push(...roleWidgets)
    
    // Add key metrics widget
    const metricsWidget = await this.generateKeyMetricsWidget(tenantId, role)
    widgets.push(metricsWidget)
    
    // Add recent activity widget
    const activityWidget = await this.generateActivityWidget(tenantId)
    widgets.push(activityWidget)
    
    // Add performance comparison widget
    const comparisonWidget = await this.generateComparisonWidget(tenantId, role)
    widgets.push(comparisonWidget)
    
    // Arrange widgets in optimal layout
    this.arrangeWidgetLayout(widgets)
    
    // Cache the dashboard
    this.widgetCache.set(`${tenantId}-${userId}`, widgets)
    
    return widgets
  }

  private async determineWidgetConfig(query: string) {
    const prompt = `
    Analyze this query and determine the best widget configuration:
    Query: "${query}"
    
    Consider:
    1. What visualization type would best represent the data?
    2. What size should the widget be?
    3. What metrics and dimensions are needed?
    4. Should it auto-refresh? If so, how often?
    
    Provide a configuration that creates an effective dashboard widget.
    `
    
    try {
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: WidgetConfigSchema,
        prompt,
        temperature: 0.3
      })
      
      return result.object
    } catch (error) {
      this.logger.error('Failed to determine widget config:', error)
      
      // Fallback configuration
      return {
        title: query.slice(0, 50),
        visualizationType: 'table' as const,
        size: 'medium' as const,
        metrics: [],
        dimensions: []
      }
    }
  }

  private transformDataForVisualization(
    data: any[],
    visualizationType: string,
    queryPlan: any
  ): any {
    if (!data || data.length === 0) {
      return this.getEmptyDataForVisualization(visualizationType)
    }
    
    switch (visualizationType) {
      case 'number':
        // Single metric display
        const value = data[0][Object.keys(data[0])[0]]
        return {
          value,
          formatted: this.formatValue(value),
          trend: this.calculateTrend(data)
        }
      
      case 'line':
      case 'bar':
        // Time series or categorical data
        return data.map(row => ({
          x: row[queryPlan.groupBy?.[0]?.column] || row[Object.keys(row)[0]],
          y: row[Object.keys(row)[1]] || row[Object.keys(row)[0]],
          label: row[queryPlan.groupBy?.[0]?.column]
        }))
      
      case 'pie':
        // Distribution data
        return data.map(row => ({
          name: row[Object.keys(row)[0]],
          value: row[Object.keys(row)[1]] || 1,
          percentage: 0 // Will be calculated client-side
        }))
      
      case 'table':
        // Raw tabular data
        return {
          columns: Object.keys(data[0]),
          rows: data
        }
      
      case 'gauge':
        // Progress/target data
        const current = data[0][Object.keys(data[0])[0]]
        return {
          value: current,
          min: 0,
          max: current * 1.5,
          target: current * 1.2,
          segments: [
            { from: 0, to: current * 0.5, color: '#ef4444' },
            { from: current * 0.5, to: current, color: '#eab308' },
            { from: current, to: current * 1.5, color: '#10b981' }
          ]
        }
      
      case 'heatmap':
        // 2D matrix data
        return this.transformToHeatmap(data)
      
      case 'scatter':
        // Correlation data
        return data.map(row => ({
          x: row[Object.keys(row)[0]],
          y: row[Object.keys(row)[1]],
          size: row[Object.keys(row)[2]] || 10,
          label: row.label || ''
        }))
      
      case 'funnel':
        // Conversion funnel data
        return this.transformToFunnel(data)
      
      default:
        return data
    }
  }

  private determineWidgetType(visualizationType: string): DashboardWidget['type'] {
    switch (visualizationType) {
      case 'number':
      case 'gauge':
        return 'metric'
      case 'line':
      case 'bar':
      case 'pie':
      case 'scatter':
      case 'heatmap':
      case 'funnel':
        return 'chart'
      case 'table':
        return 'table'
      default:
        return 'ai-generated'
    }
  }

  private getVisualizationConfig(type: string): any {
    const configs: Record<string, any> = {
      line: {
        colors: ['#3b82f6', '#10b981', '#f59e0b'],
        showLegend: true,
        animate: true,
        showLabels: false
      },
      bar: {
        colors: ['#8b5cf6', '#ec4899', '#06b6d4'],
        showLegend: false,
        animate: true,
        showLabels: true
      },
      pie: {
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        showLegend: true,
        animate: true,
        showLabels: true
      },
      table: {
        showLabels: true
      },
      gauge: {
        animate: true
      }
    }
    
    return configs[type] || {}
  }

  private generateWidgetActions(config: any, queryPlan: any): DashboardWidget['actions'] {
    const actions = []
    
    // Add drill-down action if grouped data
    if (queryPlan.groupBy?.length > 0) {
      actions.push({
        label: 'Drill Down',
        icon: 'zoom-in',
        action: 'drillDown',
        params: { groupBy: queryPlan.groupBy[0].column }
      })
    }
    
    // Add export action
    actions.push({
      label: 'Export',
      icon: 'download',
      action: 'exportData',
      params: { format: 'csv' }
    })
    
    // Add refresh action
    actions.push({
      label: 'Refresh',
      icon: 'refresh',
      action: 'refreshWidget',
      params: {}
    })
    
    return actions
  }

  private getVisualizationForInsightType(insight: Insight): DashboardWidget['visualization']['type'] {
    if (insight.visualization?.type) {
      return insight.visualization.type as DashboardWidget['visualization']['type']
    }
    
    switch (insight.type) {
      case 'trend':
        return 'line'
      case 'anomaly':
        return 'scatter'
      case 'pattern':
        return 'bar'
      case 'prediction':
        return 'line'
      case 'recommendation':
        return 'table'
      default:
        return 'number'
    }
  }

  private determineInsightWidgetSize(insight: Insight): DashboardWidget['size'] {
    if (insight.priority === 1) return 'large'
    if (insight.visualization?.data && Array.isArray(insight.visualization.data)) {
      return insight.visualization.data.length > 10 ? 'large' : 'medium'
    }
    return 'small'
  }

  private formatInsightData(insight: Insight): any {
    if (insight.metric) {
      return {
        value: insight.metric.value,
        change: insight.metric.change,
        changePercent: insight.metric.changePercent,
        unit: insight.metric.unit
      }
    }
    
    return {
      title: insight.title,
      description: insight.description,
      impact: insight.impact,
      severity: insight.severity
    }
  }

  private getInsightColors(severity: Insight['severity']): string[] {
    const colorMap = {
      info: ['#3b82f6', '#60a5fa', '#93c5fd'],
      success: ['#10b981', '#34d399', '#6ee7b7'],
      warning: ['#f59e0b', '#fbbf24', '#fcd34d'],
      critical: ['#ef4444', '#f87171', '#fca5a5']
    }
    
    return colorMap[severity]
  }

  private async generateRoleSpecificWidgets(
    role: string,
    tenantId: string,
    userId: string
  ): Promise<DashboardWidget[]> {
    const widgets: DashboardWidget[] = []
    
    switch (role.toLowerCase()) {
      case 'ceo':
      case 'admin':
        widgets.push(
          await this.generateWidgetFromQuery('Total revenue this month', tenantId, userId),
          await this.generateWidgetFromQuery('Pipeline value by stage', tenantId, userId),
          await this.generateWidgetFromQuery('Win rate trend', tenantId, userId)
        )
        break
      
      case 'sales':
        widgets.push(
          await this.generateWidgetFromQuery('My open deals', tenantId, userId),
          await this.generateWidgetFromQuery('Deals closing this week', tenantId, userId),
          await this.generateWidgetFromQuery('Activity summary', tenantId, userId)
        )
        break
      
      case 'marketing':
        widgets.push(
          await this.generateWidgetFromQuery('Lead sources performance', tenantId, userId),
          await this.generateWidgetFromQuery('Campaign ROI', tenantId, userId),
          await this.generateWidgetFromQuery('Conversion rates by channel', tenantId, userId)
        )
        break
      
      default:
        widgets.push(
          await this.generateWidgetFromQuery('Key metrics overview', tenantId, userId)
        )
    }
    
    return widgets.filter(w => w !== null)
  }

  private async generateKeyMetricsWidget(tenantId: string, role: string): Promise<DashboardWidget> {
    // Execute query for key metrics
    const metrics = await this.dataSource.query(`
      SELECT 
        COUNT(DISTINCT d.id) as total_deals,
        SUM(CASE WHEN d.stage = 'Closed Won' THEN d.amount ELSE 0 END) as revenue,
        AVG(CASE WHEN d.stage = 'Closed Won' THEN d.amount ELSE NULL END) as avg_deal_size,
        COUNT(DISTINCT CASE WHEN d.stage = 'Closed Won' THEN d.id END) * 100.0 / COUNT(DISTINCT d.id) as win_rate
      FROM crm_deals d
      WHERE d.tenantId = ?
        AND d.closeDate >= date('now', '-30 days')
    `, [tenantId])
    
    return {
      id: `widget-metrics-${Date.now()}`,
      type: 'metric',
      title: 'Key Performance Metrics',
      size: 'large',
      visualization: {
        type: 'number',
        data: {
          metrics: [
            {
              label: 'Total Deals',
              value: metrics[0].total_deals,
              format: 'number'
            },
            {
              label: 'Revenue',
              value: metrics[0].revenue,
              format: 'currency'
            },
            {
              label: 'Avg Deal Size',
              value: metrics[0].avg_deal_size,
              format: 'currency'
            },
            {
              label: 'Win Rate',
              value: metrics[0].win_rate,
              format: 'percentage'
            }
          ]
        }
      },
      metadata: {
        source: 'query',
        lastUpdated: new Date(),
        refreshRate: 300,
        tenantId
      }
    }
  }

  private async generateActivityWidget(tenantId: string): Promise<DashboardWidget> {
    const activities = await this.dataSource.query(`
      SELECT 
        type,
        COUNT(*) as count,
        DATE(occurredAt) as date
      FROM crm_activities
      WHERE tenantId = ?
        AND occurredAt >= date('now', '-7 days')
      GROUP BY type, date
      ORDER BY date DESC
    `, [tenantId])
    
    return {
      id: `widget-activity-${Date.now()}`,
      type: 'chart',
      title: 'Weekly Activity Trend',
      size: 'medium',
      visualization: {
        type: 'line',
        data: activities.map((a: any) => ({
          date: a.date,
          type: a.type,
          count: a.count
        }))
      },
      metadata: {
        source: 'query',
        lastUpdated: new Date(),
        refreshRate: 600,
        tenantId
      }
    }
  }

  private async generateComparisonWidget(tenantId: string, role: string): Promise<DashboardWidget> {
    const comparison = await this.dataSource.query(`
      SELECT 
        strftime('%Y-%m', closeDate) as month,
        SUM(amount) as revenue,
        COUNT(*) as deals
      FROM crm_deals
      WHERE tenantId = ?
        AND stage = 'Closed Won'
        AND closeDate >= date('now', '-6 months')
      GROUP BY month
      ORDER BY month
    `, [tenantId])
    
    return {
      id: `widget-comparison-${Date.now()}`,
      type: 'chart',
      title: 'Revenue Trend (6 Months)',
      size: 'large',
      visualization: {
        type: 'bar',
        data: comparison.map((c: any) => ({
          month: c.month,
          revenue: c.revenue,
          deals: c.deals
        }))
      },
      metadata: {
        source: 'query',
        lastUpdated: new Date(),
        refreshRate: 3600,
        tenantId
      }
    }
  }

  private arrangeWidgetLayout(widgets: DashboardWidget[]) {
    // Simple grid layout algorithm
    const grid = { cols: 4, rowHeight: 100 }
    let currentX = 0
    let currentY = 0
    
    const sizeMap = {
      small: { w: 1, h: 1 },
      medium: { w: 2, h: 2 },
      large: { w: 3, h: 2 },
      full: { w: 4, h: 2 }
    }
    
    widgets.forEach(widget => {
      const size = sizeMap[widget.size]
      
      // Check if widget fits in current row
      if (currentX + size.w > grid.cols) {
        currentX = 0
        currentY += 2
      }
      
      widget.position = { x: currentX, y: currentY }
      currentX += size.w
    })
  }

  private createErrorWidget(query: string, error: string, tenantId: string): DashboardWidget {
    return {
      id: `widget-error-${Date.now()}`,
      type: 'ai-generated',
      title: 'Widget Generation Failed',
      description: `Failed to create widget for: "${query}"`,
      size: 'small',
      visualization: {
        type: 'table',
        data: {
          error,
          query,
          timestamp: new Date().toISOString()
        }
      },
      metadata: {
        source: 'query',
        lastUpdated: new Date(),
        tenantId
      }
    }
  }

  private formatValue(value: any): string {
    if (typeof value === 'number') {
      if (value > 1000000) {
        return `${(value / 1000000).toFixed(1)}M`
      } else if (value > 1000) {
        return `${(value / 1000).toFixed(1)}K`
      }
      return value.toFixed(0)
    }
    return String(value)
  }

  private calculateTrend(data: any[]): { direction: 'up' | 'down' | 'stable'; percent: number } {
    if (data.length < 2) {
      return { direction: 'stable', percent: 0 }
    }
    
    // Simple trend calculation (can be enhanced)
    const firstValue = Number(data[0][Object.keys(data[0])[0]])
    const lastValue = Number(data[data.length - 1][Object.keys(data[0])[0]])
    const change = ((lastValue - firstValue) / firstValue) * 100
    
    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      percent: Math.abs(change)
    }
  }

  private getEmptyDataForVisualization(type: string): any {
    const emptyData: Record<string, any> = {
      number: { value: 0, formatted: '0' },
      line: [],
      bar: [],
      pie: [],
      table: { columns: [], rows: [] },
      gauge: { value: 0, min: 0, max: 100 },
      heatmap: [],
      scatter: [],
      funnel: []
    }
    
    return emptyData[type] || []
  }

  private transformToHeatmap(data: any[]): any {
    // Transform data into heatmap format
    // This is a simplified version - can be enhanced based on actual data structure
    return data.map((row, y) => 
      Object.keys(row).map((key, x) => ({
        x,
        y,
        value: row[key],
        label: key
      }))
    ).flat()
  }

  private transformToFunnel(data: any[]): any {
    // Transform data into funnel format
    const total = data[0]?.[Object.keys(data[0])[1]] || 1
    
    return data.map((row, index) => ({
      stage: row[Object.keys(row)[0]],
      value: row[Object.keys(row)[1]],
      percentage: (row[Object.keys(row)[1]] / total) * 100,
      dropoff: index > 0 ? 
        ((data[index - 1][Object.keys(data[0])[1]] - row[Object.keys(row)[1]]) / 
         data[index - 1][Object.keys(data[0])[1]]) * 100 : 0
    }))
  }
}