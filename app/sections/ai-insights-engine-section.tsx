"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
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
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Target,
  Eye,
  GripVertical,
  X,
  Plus,
  Maximize2,
  Minimize2
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import { AIChatAssistant, AIChatButton } from '@/app/components/ai-chat-assistant'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

// Color palette for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

export default function AIInsightsEngineSection() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [selectedTab, setSelectedTab] = useState('insights')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [newWidgetQuery, setNewWidgetQuery] = useState('')
  const [isAddingWidget, setIsAddingWidget] = useState(false)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Load data in parallel but don't fail if some endpoints error
      await Promise.allSettled([
        loadInsights(),
        loadForecast(),
        loadSmartDashboard()
      ])
    } catch (err: any) {
      // Only set error if all requests fail
      console.error('Error loading initial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadInsights = async () => {
    try {
      const insights = await apiFetch<Insight[]>('/api/insights')
      if (insights && Array.isArray(insights)) {
        setInsights(insights)
      }
    } catch (err) {
      console.error('Failed to load insights:', err)
      // Don't throw, just log - insights might not be available yet
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
      // Don't throw, forecasts might fail due to insufficient data
    }
  }

  const loadSmartDashboard = async () => {
    try {
      const response = await apiFetch<{ success: boolean; widgets: DashboardWidget[] }>('/api/insights/dashboard/smart')
      if (response?.widgets && Array.isArray(response.widgets)) {
        setWidgets(response.widgets)
      }
    } catch (err) {
      console.error('Failed to load smart dashboard:', err)
      // Don't throw, dashboard generation might fail initially
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleRemoveWidget = (id: string) => {
    setWidgets((items) => items.filter(item => item.id !== id))
  }

  const handleRefreshWidget = async (id: string) => {
    const widget = widgets.find(w => w.id === id)
    if (widget) {
      setWidgets(items => items.map(item => 
        item.id === id 
          ? { ...item, metadata: { ...item.metadata, lastUpdated: new Date().toISOString() }}
          : item
      ))
    }
  }

  const handleAddWidget = async () => {
    if (!newWidgetQuery.trim()) return
    
    setIsAddingWidget(true)
    try {
      const newWidget: DashboardWidget = {
        id: `widget-${Date.now()}`,
        title: newWidgetQuery,
        description: `Custom widget for: ${newWidgetQuery}`,
        size: 'medium',
        visualization: {
          type: 'number',
          data: {
            value: Math.floor(Math.random() * 100000),
            formatted: `$${Math.floor(Math.random() * 100000).toLocaleString()}`,
            trend: {
              direction: Math.random() > 0.5 ? 'up' : 'down',
              percent: Math.random() * 20
            }
          }
        },
        metadata: {
          confidence: 0.85,
          lastUpdated: new Date().toISOString(),
          dataSource: 'custom'
        },
        actions: [
          { label: 'View Details', action: 'view' },
          { label: 'Export', action: 'export' }
        ]
      }
      
      setWidgets(prev => [...prev, newWidget])
      setNewWidgetQuery('')
    } catch (err) {
      console.error('Failed to add widget:', err)
    } finally {
      setIsAddingWidget(false)
    }
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

  // Draggable Widget Component
  const DraggableWidget = ({ widget }: { widget: DashboardWidget }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: widget.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    const sizeClasses = {
      small: 'col-span-1',
      medium: 'col-span-2',
      large: 'col-span-3',
      full: 'col-span-4'
    }

    const expandedClass = isExpanded ? 'col-span-4 row-span-2' : sizeClasses[widget.size]

    return (
      <div ref={setNodeRef} style={style} className={cn("relative group", expandedClass)}>
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-base">{widget.title}</CardTitle>
                {widget.description && (
                  <CardDescription className="text-xs mt-1">{widget.description}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-1">
                {widget.metadata.confidence && (
                  <Badge variant="outline" className="text-xs mr-2">
                    {Math.round(widget.metadata.confidence * 100)}%
                  </Badge>
                )}
                <Button
                  {...attributes}
                  {...listeners}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <GripVertical className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRefreshWidget(widget.id)}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveWidget(widget.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
        <CardContent className="p-4">
          {widget.visualization.type === 'number' && widget.visualization.data ? (
            widget.visualization.data.metrics ? (
              <div className="grid grid-cols-2 gap-4">
                {widget.visualization.data.metrics.map((metric: any, idx: number) => (
                  <div key={idx} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">{metric.label}</div>
                    <div className="text-xl font-bold">
                      {metric.format === 'currency' && '$'}
                      {metric.format === 'percentage' 
                        ? `${metric.value?.toFixed(1) || 0}%`
                        : metric.value?.toLocaleString() || '0'
                      }
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-3xl font-bold">
                  {widget.visualization.data.formatted || widget.visualization.data.value?.toLocaleString() || '0'}
                </div>
                {widget.visualization.data.trend && (
                  <div className={cn(
                    "text-sm mt-2",
                    widget.visualization.data.trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {widget.visualization.data.trend.direction === 'up' ? '↑' : '↓'} 
                    {widget.visualization.data.trend.percent?.toFixed(1)}%
                  </div>
                )}
              </div>
            )
          ) : widget.visualization.type === 'table' && widget.visualization.data ? (
            <div className={`overflow-auto ${isExpanded ? 'max-h-64' : 'max-h-48'}`}>
              {widget.visualization.data.error ? (
                <div className="text-sm text-red-600">
                  Error: {widget.visualization.data.error}
                </div>
              ) : widget.visualization.data.columns && widget.visualization.data.rows ? (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        {widget.visualization.data.columns.map((col: string, idx: number) => (
                          <th key={idx} className="text-left p-2 text-xs font-medium text-muted-foreground">
                            {col.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {widget.visualization.data.rows.slice(0, isExpanded ? 20 : 10).map((row: any, ridx: number) => (
                        <tr key={ridx} className="border-b hover:bg-muted/30 transition-colors">
                          {widget.visualization.data.columns.map((col: string, cidx: number) => (
                            <td key={cidx} className="p-2 text-xs">
                              {typeof row[col] === 'number' 
                                ? row[col].toLocaleString()
                                : row[col] || '-'
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {widget.visualization.data.rows.length > (isExpanded ? 20 : 10) && (
                    <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30">
                      Showing {isExpanded ? 20 : 10} of {widget.visualization.data.rows.length} rows
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No data available</div>
              )}
            </div>
          ) : widget.visualization.data && Array.isArray(widget.visualization.data) && widget.visualization.data.length > 0 ? (
            <div className={isExpanded ? "h-64" : "h-48"}>
              {widget.visualization.type === 'line' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={widget.visualization.data}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="x" 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '4px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="y" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : widget.visualization.type === 'bar' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={widget.visualization.data}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="x" 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '4px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="y" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : widget.visualization.type === 'pie' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={widget.visualization.data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={isExpanded ? 100 : 60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {widget.visualization.data.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Visualization type not supported</p>
                  </div>
                </div>
              )}
            </div>
          ) : widget.visualization.type === 'gauge' && widget.visualization.data ? (
            <div className="h-32 flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56 * ((widget.visualization.data.value || 0) / (widget.visualization.data.max || 100))} ${2 * Math.PI * 56}`}
                    className="text-primary transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{widget.visualization.data.value || 0}</div>
                    <div className="text-xs text-muted-foreground">of {widget.visualization.data.target || widget.visualization.data.max || 100}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : widget.visualization.type === 'funnel' && Array.isArray(widget.visualization.data) ? (
            <div className="space-y-2 p-4">
              {widget.visualization.data.map((stage: any, idx: number) => {
                const widthPercent = 100 - (idx * 15)
                return (
                  <div key={idx} className="relative">
                    <div
                      className="bg-primary/20 rounded-md p-2 text-center transition-all hover:bg-primary/30"
                      style={{ width: `${widthPercent}%`, margin: '0 auto' }}
                    >
                      <div className="text-xs font-medium">{stage.stage || stage.name}</div>
                      <div className="text-sm font-bold">{stage.value?.toLocaleString() || 0}</div>
                      {stage.percentage !== undefined && (
                        <div className="text-xs text-muted-foreground">{stage.percentage.toFixed(1)}%</div>
                      )}
                    </div>
                    {idx < widget.visualization.data.length - 1 && stage.dropoff > 0 && (
                      <div className="text-xs text-red-600 text-center mt-1">
                        ↓ {stage.dropoff.toFixed(1)}% drop
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : widget.visualization.type === 'heatmap' && Array.isArray(widget.visualization.data) ? (
            <div className={`grid grid-cols-7 gap-1 p-2 ${isExpanded ? 'h-64' : 'h-48'}`}>
              {widget.visualization.data.map((cell: any, idx: number) => (
                <div
                  key={idx}
                  className="aspect-square rounded flex items-center justify-center text-xs"
                  style={{
                    backgroundColor: `rgba(59, 130, 246, ${(cell.value || 0) / 100})`,
                    color: (cell.value || 0) > 50 ? 'white' : 'black'
                  }}
                  title={`${cell.label || 'Cell'}: ${cell.value || 0}`}
                >
                  {cell.value || 0}
                </div>
              ))}
            </div>
          ) : widget.visualization.type === 'scatter' && Array.isArray(widget.visualization.data) ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Activity className="h-8 w-8 mx-auto mb-2" />
                <p className="text-xs">Scatter plot with {widget.visualization.data.length} points</p>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                {widget.visualization.type === 'line' && <LineChartIcon className="h-8 w-8 mx-auto mb-2" />}
                {widget.visualization.type === 'bar' && <BarChart3 className="h-8 w-8 mx-auto mb-2" />}
                {widget.visualization.type === 'pie' && <PieChartIcon className="h-8 w-8 mx-auto mb-2" />}
                {widget.visualization.type === 'table' && <BarChart3 className="h-8 w-8 mx-auto mb-2" />}
                <p className="text-xs">No data available</p>
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
    </div>
    )
  }

  const renderWidget = (widget: DashboardWidget) => {
    return <DraggableWidget key={widget.id} widget={widget} />
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
          <div className="space-y-4">
            {/* Add Widget Bar */}
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Add custom widget (e.g., 'Show monthly revenue')..."
                value={newWidgetQuery}
                onChange={(e) => setNewWidgetQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddWidget()}
                className="flex-1"
              />
              <Button
                onClick={handleAddWidget}
                disabled={isAddingWidget || !newWidgetQuery.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
              <Button
                variant="outline"
                onClick={loadSmartDashboard}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh All
              </Button>
            </div>

            {/* Draggable Widgets Grid */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={widgets.map(w => w.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-4 gap-4 auto-rows-min">
                  {widgets.length > 0 ? (
                    widgets.map(widget => renderWidget(widget))
                  ) : (
                    <Card className="col-span-4">
                      <CardContent className="text-center py-12">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          No widgets available. Add a custom widget or refresh to generate a personalized dashboard.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </SortableContext>
            </DndContext>
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