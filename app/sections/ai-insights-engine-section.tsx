"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  RefreshCw,
  Download,
  ChevronRight,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Zap,
  Target,
  Eye
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import { AIChatAssistant, AIChatButton } from '@/app/components/ai-chat-assistant'

interface Insight {
  id: string
  type: 'trend' | 'anomaly' | 'pattern' | 'prediction' | 'recommendation'
  severity: 'info' | 'warning' | 'critical' | 'success'
  title: string
  description: string
  impact: string
  metric?: {
    value: number
    change: number
    changePercent: number
    unit?: string
  }
  visualization?: {
    type: string
    data: any
  }
  actions?: {
    label: string
    action: string
    params?: any
  }[]
  confidence: number
  timestamp: string
  priority: number
}

interface Forecast {
  id: string
  type: string
  metric: string
  period: string
  predictions: {
    date: string
    value: number
    confidence: number
    upperBound: number
    lowerBound: number
  }[]
  accuracy: number
  factors: {
    name: string
    impact: number
    description: string
  }[]
  recommendations: string[]
}

interface DashboardWidget {
  id: string
  type: string
  title: string
  description?: string
  size: 'small' | 'medium' | 'large' | 'full'
  visualization: {
    type: string
    data: any
    config?: any
  }
  actions?: {
    label: string
    icon?: string
    action: string
    params?: any
  }[]
  metadata: {
    source: string
    confidence?: number
    lastUpdated: string
    refreshRate?: number
  }
}

export default function AIInsightsEngineSection() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [selectedTab, setSelectedTab] = useState('insights')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([
        loadInsights(),
        loadForecast(),
        loadSmartDashboard()
      ])
    } catch (err: any) {
      setError(err?.message || 'Failed to load AI insights')
    } finally {
      setLoading(false)
    }
  }

  const loadInsights = async () => {
    try {
      const insights = await apiFetch<Insight[]>('/api/insights')
      if (insights) {
        setInsights(insights)
      }
    } catch (err) {
      console.error('Failed to load insights:', err)
    }
  }

  const loadForecast = async () => {
    try {
      const forecast = await apiFetch<Forecast>('/api/insights/forecast/revenue')
      if (forecast) {
        setForecast(forecast)
      }
    } catch (err) {
      console.error('Failed to load forecast:', err)
    }
  }

  const loadSmartDashboard = async () => {
    try {
      const response = await apiFetch<{ success: boolean; widgets: DashboardWidget[] }>('/api/insights/dashboard/smart')
      if (response?.widgets) {
        setWidgets(response.widgets)
      }
    } catch (err) {
      console.error('Failed to load smart dashboard:', err)
    }
  }

  const runAnalysis = async () => {
    setRefreshing(true)
    try {
      const response = await apiFetch<{ success: boolean; count: number; insights: Insight[] }>('/api/insights/analyze', {
        method: 'POST',
        body: JSON.stringify({})
      })
      if (response?.insights) {
        setInsights(response.insights)
      }
    } catch (err) {
      console.error('Failed to run analysis:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const handleWidgetGenerated = (widget: DashboardWidget) => {
    setWidgets(prev => [...prev, widget])
    setSelectedTab('dashboard')
  }

  const getSeverityIcon = (severity: Insight['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />
      case 'warning':
        return <TrendingDown className="h-4 w-4" />
      case 'success':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: Insight['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getTypeIcon = (type: Insight['type']) => {
    switch (type) {
      case 'trend':
        return <Activity className="h-4 w-4" />
      case 'anomaly':
        return <Zap className="h-4 w-4" />
      case 'pattern':
        return <BarChart3 className="h-4 w-4" />
      case 'prediction':
        return <Target className="h-4 w-4" />
      case 'recommendation':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const renderInsightCard = (insight: Insight) => (
    <Card key={insight.id} className={cn("mb-4", getSeverityColor(insight.severity))}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getSeverityIcon(insight.severity)}
            <CardTitle className="text-lg">{insight.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getTypeIcon(insight.type)}
              <span className="ml-1">{insight.type}</span>
            </Badge>
            <Badge variant="outline" className="text-xs">
              {Math.round(insight.confidence * 100)}% confidence
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
        
        {insight.metric && (
          <div className="flex items-center gap-4 my-3 p-3 bg-background rounded-lg">
            <div className="text-2xl font-bold">
              {insight.metric.unit === 'USD' ? '$' : ''}
              {insight.metric.value.toLocaleString()}
              {insight.metric.unit === '%' ? '%' : ''}
            </div>
            <div className={cn(
              "flex items-center gap-1 text-sm",
              insight.metric.change > 0 ? "text-green-600" : "text-red-600"
            )}>
              {insight.metric.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(insight.metric.changePercent).toFixed(1)}%
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-2">
            <strong>Impact:</strong> {insight.impact}
          </p>
          
          {insight.actions && insight.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {insight.actions.map((action, idx) => (
                <Button key={idx} size="sm" variant="outline">
                  {action.label}
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderForecast = () => {
    if (!forecast) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle>{forecast.metric} Forecast</CardTitle>
          <CardDescription>
            {forecast.period} predictions with {(forecast.accuracy * 100).toFixed(0)}% accuracy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Prediction Summary */}
            <div className="grid grid-cols-3 gap-4">
              {forecast.predictions.slice(0, 3).map((pred, idx) => (
                <div key={idx} className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">
                    {new Date(pred.date).toLocaleDateString()}
                  </div>
                  <div className="text-lg font-bold">
                    ${pred.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ±${(pred.upperBound - pred.value).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Key Factors */}
            <div>
              <h4 className="text-sm font-medium mb-2">Key Factors</h4>
              <div className="space-y-2">
                {forecast.factors.map((factor, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{factor.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary"
                          style={{ width: `${factor.impact * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {(factor.impact * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {forecast.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {forecast.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 mt-0.5 text-green-600" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderWidget = (widget: DashboardWidget) => {
    const sizeClasses = {
      small: 'col-span-1',
      medium: 'col-span-2',
      large: 'col-span-3',
      full: 'col-span-4'
    }

    return (
      <Card key={widget.id} className={sizeClasses[widget.size]}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{widget.title}</CardTitle>
            {widget.metadata.confidence && (
              <Badge variant="outline" className="text-xs">
                {Math.round(widget.metadata.confidence * 100)}%
              </Badge>
            )}
          </div>
          {widget.description && (
            <CardDescription className="text-xs">{widget.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {widget.visualization.type === 'number' && widget.visualization.data.metrics ? (
            <div className="grid grid-cols-2 gap-4">
              {widget.visualization.data.metrics.map((metric: any, idx: number) => (
                <div key={idx} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">{metric.label}</div>
                  <div className="text-xl font-bold">
                    {metric.format === 'currency' && '$'}
                    {metric.format === 'percentage' 
                      ? `${metric.value.toFixed(1)}%`
                      : metric.value.toLocaleString()
                    }
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                {widget.visualization.type === 'line' && <LineChart className="h-8 w-8 mx-auto mb-2" />}
                {widget.visualization.type === 'bar' && <BarChart3 className="h-8 w-8 mx-auto mb-2" />}
                {widget.visualization.type === 'pie' && <PieChart className="h-8 w-8 mx-auto mb-2" />}
                <p className="text-xs">Visualization placeholder</p>
              </div>
            </div>
          )}
          
          {widget.actions && widget.actions.length > 0 && (
            <div className="flex gap-2 mt-3 pt-3 border-t">
              {widget.actions.map((action, idx) => (
                <Button key={idx} size="sm" variant="ghost" className="text-xs">
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">AI Insights Engine</h1>
            <p className="text-muted-foreground">
              Powered by advanced analytics and machine learning
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={runAnalysis}
              disabled={refreshing}
            >
              {refreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Run Analysis</span>
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4" />
              <span className="ml-2">Export</span>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="insights">
            <Eye className="h-4 w-4 mr-2" />
            Insights ({insights.length})
          </TabsTrigger>
          <TabsTrigger value="forecast">
            <Target className="h-4 w-4 mr-2" />
            Forecasts
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Smart Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {insights.length > 0 ? (
                insights.map(insight => renderInsightCard(insight))
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No insights available. Run analysis to generate insights.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="forecast">
          <div className="space-y-4">
            {renderForecast()}
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-4 gap-4">
            {widgets.length > 0 ? (
              widgets.map(widget => renderWidget(widget))
            ) : (
              <Card className="col-span-4">
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No widgets available. The system will generate a personalized dashboard based on your role.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Chat Assistant */}
      {showChat ? (
        <AIChatAssistant 
          onClose={() => setShowChat(false)}
          onWidgetGenerated={handleWidgetGenerated}
        />
      ) : (
        <AIChatButton onClick={() => setShowChat(true)} />
      )}
    </div>
  )
}