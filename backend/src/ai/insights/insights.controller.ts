import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  UseGuards, 
  Request,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Delete
} from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { InsightsDiscoveryService } from './insights-discovery.service'
import { PredictiveAnalyticsService } from './predictive-analytics.service'
import { WidgetGenerationService, DashboardWidget } from './widget-generation.service'

@Controller('insights')
@UseGuards(JwtAuthGuard)
export class InsightsController {
  private readonly logger = new Logger(InsightsController.name)

  constructor(
    private insightsService: InsightsDiscoveryService,
    private predictiveService: PredictiveAnalyticsService,
    private widgetService: WidgetGenerationService,
  ) {}

  // Insights endpoints
  @Get()
  async getInsights(
    @Request() req: any,
    @Query('limit') limit = 10,
    @Query('type') type?: string,
    @Query('department') department?: string
  ) {
    try {
      const tenantId = req.user.tenantId
      
      if (type) {
        return await this.insightsService.getInsightsByType(
          tenantId, 
          type as any
        )
      }
      
      if (department) {
        return await this.insightsService.getInsightsByDepartment(
          tenantId,
          department
        )
      }
      
      return await this.insightsService.getInsightsForTenant(tenantId, limit)
    } catch (error) {
      this.logger.error('Failed to get insights:', error)
      throw new HttpException(
        'Failed to retrieve insights',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('analyze')
  async analyzeNow(@Request() req: any) {
    try {
      const tenantId = req.user.tenantId
      const insights = await this.insightsService.analyzeForTenant(tenantId)
      
      return {
        success: true,
        count: insights.length,
        insights: insights.slice(0, 10)
      }
    } catch (error) {
      this.logger.error('Failed to analyze:', error)
      throw new HttpException(
        'Analysis failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  // Predictive Analytics endpoints
  @Get('forecast/revenue')
  async getRevenueForecast(
    @Request() req: any,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'monthly',
    @Query('horizon') horizon = 90
  ) {
    try {
      const tenantId = req.user.tenantId
      return await this.predictiveService.generateRevenueForecast(
        tenantId,
        period,
        horizon
      )
    } catch (error) {
      this.logger.error('Failed to generate revenue forecast:', error)
      throw new HttpException(
        'Forecast generation failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('forecast/deals')
  async getDealForecast(
    @Request() req: any,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'weekly'
  ) {
    try {
      const tenantId = req.user.tenantId
      return await this.predictiveService.generateDealForecast(tenantId, period)
    } catch (error) {
      this.logger.error('Failed to generate deal forecast:', error)
      throw new HttpException(
        'Forecast generation failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('forecast/conversion')
  async getConversionForecast(@Request() req: any) {
    try {
      const tenantId = req.user.tenantId
      return await this.predictiveService.forecastConversionRate(tenantId)
    } catch (error) {
      this.logger.error('Failed to forecast conversion:', error)
      throw new HttpException(
        'Forecast generation failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  // Widget Generation endpoints
  @Post('widget/generate')
  async generateWidget(
    @Request() req: any,
    @Body() body: { query: string; size?: DashboardWidget['size'] }
  ) {
    try {
      const tenantId = req.user.tenantId
      const userId = req.user.sub
      
      const widget = await this.widgetService.generateWidgetFromQuery(
        body.query,
        tenantId,
        userId
      )
      
      return {
        success: true,
        widget
      }
    } catch (error) {
      this.logger.error('Failed to generate widget:', error)
      throw new HttpException(
        'Widget generation failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('widget/from-insight')
  async createWidgetFromInsight(
    @Request() req: any,
    @Body() body: { insightId: string }
  ) {
    try {
      const tenantId = req.user.tenantId
      const insights = await this.insightsService.getInsightsForTenant(tenantId, 100)
      const insight = insights.find(i => i.id === body.insightId)
      
      if (!insight) {
        throw new HttpException('Insight not found', HttpStatus.NOT_FOUND)
      }
      
      const widget = await this.widgetService.generateWidgetFromInsight(insight)
      
      return {
        success: true,
        widget
      }
    } catch (error: any) {
      this.logger.error('Failed to create widget from insight:', error)
      throw new HttpException(
        error?.message || 'Widget creation failed',
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('widget/from-forecast')
  async createWidgetFromForecast(
    @Request() req: any,
    @Body() body: { 
      type: 'revenue' | 'deals';
      period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' 
    }
  ) {
    try {
      const tenantId = req.user.tenantId
      
      let forecast
      if (body.type === 'revenue') {
        forecast = await this.predictiveService.generateRevenueForecast(
          tenantId,
          body.period || 'monthly'
        )
      } else {
        forecast = await this.predictiveService.generateDealForecast(
          tenantId,
          body.period || 'weekly'
        )
      }
      
      const widget = await this.widgetService.generateWidgetFromForecast(forecast)
      
      return {
        success: true,
        widget
      }
    } catch (error) {
      this.logger.error('Failed to create widget from forecast:', error)
      throw new HttpException(
        'Widget creation failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('dashboard/smart')
  async getSmartDashboard(@Request() req: any) {
    try {
      this.logger.log(`🚀 SMART DASHBOARD REQUEST RECEIVED`)
      this.logger.log(`User object: ${JSON.stringify(req.user)}`)
      const tenantId = req.user.tenantId || req.user.tenant?.id
      const userId = req.user.sub || req.user.id
      const role = typeof req.user.role === 'string' 
        ? req.user.role 
        : (req.user.role?.name || 'user')
      
      this.logger.log(`🔍 Extracted - tenantId: ${tenantId}, userId: ${userId}, role: ${role}`)
      
      this.logger.log(`📞 CALLING widgetService.generateSmartDashboard`)
      const widgets = await this.widgetService.generateSmartDashboard(
        tenantId,
        userId,
        role
      )
      this.logger.log(`📦 RECEIVED ${widgets.length} widgets from service`)
      
      return {
        success: true,
        widgets,
        metadata: {
          generatedAt: new Date(),
          userId,
          role,
          widgetCount: widgets.length
        }
      }
    } catch (error) {
      this.logger.error('Failed to generate smart dashboard:', error)
      throw new HttpException(
        'Dashboard generation failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('dashboard/save')
  async saveDashboard(
    @Request() req: any,
    @Body() body: { 
      name: string;
      widgets: DashboardWidget[];
      isDefault?: boolean 
    }
  ) {
    try {
      // This would save to a database
      // For now, we'll just return success
      return {
        success: true,
        dashboardId: `dashboard-${Date.now()}`,
        message: 'Dashboard saved successfully'
      }
    } catch (error) {
      this.logger.error('Failed to save dashboard:', error)
      throw new HttpException(
        'Dashboard save failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('dashboard/:id')
  async getDashboard(
    @Request() req: any,
    @Param('id') dashboardId: string
  ) {
    try {
      // This would load from database
      // For now, generate a fresh dashboard
      const tenantId = req.user.tenantId
      const userId = req.user.sub
      const role = typeof req.user.role === 'string' 
        ? req.user.role 
        : (req.user.role?.name || 'user')
      
      const widgets = await this.widgetService.generateSmartDashboard(
        tenantId,
        userId,
        role
      )
      
      return {
        success: true,
        dashboard: {
          id: dashboardId,
          name: 'My Dashboard',
          widgets,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    } catch (error) {
      this.logger.error('Failed to load dashboard:', error)
      throw new HttpException(
        'Dashboard load failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Delete('dashboard/:id')
  async deleteDashboard(
    @Request() req: any,
    @Param('id') dashboardId: string
  ) {
    try {
      // This would delete from database
      return {
        success: true,
        message: 'Dashboard deleted successfully'
      }
    } catch (error) {
      this.logger.error('Failed to delete dashboard:', error)
      throw new HttpException(
        'Dashboard deletion failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  // Daily Briefing endpoint
  @Get('briefing/daily')
  async getDailyBriefing(@Request() req: any) {
    try {
      const tenantId = req.user.tenantId
      const role = typeof req.user.role === 'string' 
        ? req.user.role 
        : (req.user.role?.name || 'user')
      
      // Get top insights
      const insights = await this.insightsService.getInsightsForTenant(tenantId, 5)
      
      // Get revenue forecast
      const forecast = await this.predictiveService.generateRevenueForecast(
        tenantId,
        'monthly',
        30
      )
      
      // Get key metrics widget
      const metricsWidget = await this.widgetService.generateWidgetFromQuery(
        'Key metrics for today',
        tenantId,
        req.user.sub
      )
      
      return {
        success: true,
        briefing: {
          date: new Date(),
          greeting: this.getGreeting(req.user.name),
          summary: this.generateSummary(insights, forecast),
          topInsights: insights.slice(0, 3),
          forecast: {
            metric: forecast.metric,
            nextPeriod: forecast.predictions[0],
            accuracy: forecast.accuracy
          },
          keyMetrics: metricsWidget.visualization.data,
          recommendations: this.getRecommendations(insights, role)
        }
      }
    } catch (error) {
      this.logger.error('Failed to generate daily briefing:', error)
      throw new HttpException(
        'Briefing generation failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  // Chat endpoint for conversational analytics
  @Post('chat')
  async chatWithData(
    @Request() req: any,
    @Body() body: { message: string; context?: any }
  ) {
    try {
      const tenantId = req.user.tenantId
      const userId = req.user.sub
      
      // Generate widget from natural language query
      const widget = await this.widgetService.generateWidgetFromQuery(
        body.message,
        tenantId,
        userId
      )
      
      // Generate insights related to the query
      const insights = await this.insightsService.getInsightsForTenant(tenantId, 3)
      
      return {
        success: true,
        response: {
          message: `I've analyzed your request: "${body.message}"`,
          widget,
          relatedInsights: insights,
          suggestedQuestions: this.getSuggestedQuestions(body.message)
        }
      }
    } catch (error) {
      this.logger.error('Failed to process chat message:', error)
      throw new HttpException(
        'Chat processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  // Helper methods
  private getGreeting(name?: string): string {
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    return name ? `${greeting}, ${name}!` : `${greeting}!`
  }

  private generateSummary(insights: any[], forecast: any): string {
    const criticalCount = insights.filter(i => i.severity === 'critical').length
    const warningCount = insights.filter(i => i.severity === 'warning').length
    
    let summary = `You have ${insights.length} new insights today`
    
    if (criticalCount > 0) {
      summary += `, including ${criticalCount} critical items that need immediate attention`
    } else if (warningCount > 0) {
      summary += `, with ${warningCount} warnings to review`
    }
    
    if (forecast.predictions[0]?.value) {
      const trend = forecast.predictions[0].value > 0 ? 'positive' : 'concerning'
      summary += `. Revenue forecast shows ${trend} trends for the coming period`
    }
    
    summary += '.'
    
    return summary
  }

  private getRecommendations(insights: any[], role: string): string[] {
    const recommendations = []
    
    // Add role-specific recommendations
    if (role === 'sales' || role === 'admin') {
      const dealInsights = insights.filter(i => i.title.toLowerCase().includes('deal'))
      if (dealInsights.length > 0) {
        recommendations.push('Review at-risk deals and take action')
      }
    }
    
    // Add insight-based recommendations
    const critical = insights.find(i => i.severity === 'critical')
    if (critical) {
      recommendations.push(`Address critical issue: ${critical.title}`)
    }
    
    // Add general recommendations
    recommendations.push(
      'Check team performance metrics',
      'Review upcoming tasks and deadlines',
      'Analyze customer engagement trends'
    )
    
    return recommendations.slice(0, 3)
  }

  private getSuggestedQuestions(query: string): string[] {
    const suggestions = []
    
    if (query.toLowerCase().includes('revenue')) {
      suggestions.push(
        'What factors are driving revenue changes?',
        'Show revenue by product category',
        'Compare this month to last month'
      )
    } else if (query.toLowerCase().includes('deal')) {
      suggestions.push(
        'Which deals are at risk?',
        'Show deal velocity by stage',
        'What is our average deal size?'
      )
    } else if (query.toLowerCase().includes('customer')) {
      suggestions.push(
        'Show customer acquisition trend',
        'What is our churn rate?',
        'Which customers generate most revenue?'
      )
    } else {
      suggestions.push(
        'Show me key performance metrics',
        'What are the latest trends?',
        'Generate a forecast for next quarter'
      )
    }
    
    return suggestions.slice(0, 3)
  }
}