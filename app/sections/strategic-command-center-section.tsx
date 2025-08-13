'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Play,
  Pause,
  RotateCw,
  Sparkles,
  Target,
  GitBranch,
  BarChart3,
  LineChart,
  PieChart,
  Zap,
  Shield,
  DollarSign,
  Users,
  Building,
  Settings,
  ChevronRight,
  Loader2,
  Info
} from 'lucide-react'
import { api } from '@/lib/api'
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart
} from 'recharts'

interface DigitalTwin {
  id: string
  health: number
  lastUpdated: string
  metrics: number
  departments: number
  processes: number
}

interface Scenario {
  id: string
  name: string
  type: string
  status: string
  createdAt: string
  simulation?: any
}

interface CommandCenterOverview {
  digitalTwin: DigitalTwin | null
  scenarios: Scenario[]
  activeSimulations: number
  completedSimulations: number
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function StrategicCommandCenterSection() {
  const [overview, setOverview] = useState<CommandCenterOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [scenarioPrompt, setScenarioPrompt] = useState('')
  const [generatingScenario, setGeneratingScenario] = useState(false)
  const [runningSimulation, setRunningSimulation] = useState(false)
  const [creatingTwin, setCreatingTwin] = useState(false)
  const [simulationResult, setSimulationResult] = useState<any>(null)

  useEffect(() => {
    loadOverview()
    const interval = setInterval(loadOverview, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadOverview = async () => {
    try {
      const data = await api.get('/api/simulator/command-center/overview')
      setOverview(data)
    } catch (error) {
      console.error('Failed to load command center overview:', error)
    } finally {
      setLoading(false)
    }
  }

  const createDigitalTwin = async () => {
    setCreatingTwin(true)
    try {
      await api.post('/api/simulator/digital-twin/create')
      await loadOverview()
    } catch (error) {
      console.error('Failed to create digital twin:', error)
    } finally {
      setCreatingTwin(false)
    }
  }

  const generateScenario = async () => {
    if (!scenarioPrompt.trim()) return
    
    setGeneratingScenario(true)
    try {
      const scenario = await api.post('/api/simulator/scenarios/generate', {
        prompt: scenarioPrompt
      })
      setScenarioPrompt('')
      await loadOverview()
      setSelectedScenario(scenario)
    } catch (error) {
      console.error('Failed to generate scenario:', error)
    } finally {
      setGeneratingScenario(false)
    }
  }

  const runSimulation = async (scenarioId: string) => {
    setRunningSimulation(true)
    try {
      const result = await api.post(`/api/simulator/scenarios/${scenarioId}/simulate`, {
        iterations: 100,
        monteCarlo: true
      })
      setSimulationResult(result)
      await loadOverview()
    } catch (error) {
      console.error('Failed to run simulation:', error)
    } finally {
      setRunningSimulation(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'ready': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-600'
    if (health >= 60) return 'text-yellow-600'
    if (health >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Command Center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Strategic Command Center
          </h2>
          <p className="text-muted-foreground mt-1">
            AI-powered business simulation and decision support system
          </p>
        </div>
        <div className="flex gap-2">
          {!overview?.digitalTwin && (
            <Button 
              onClick={createDigitalTwin}
              disabled={creatingTwin}
              className="gap-2"
            >
              {creatingTwin ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              Create Digital Twin
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={loadOverview}>
            <RotateCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Digital Twin Status */}
      {overview?.digitalTwin ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Digital Twin Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getHealthColor(overview.digitalTwin.health)}`}>
                  {overview.digitalTwin.health.toFixed(0)}%
                </div>
                <p className="text-sm text-muted-foreground">Health Score</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">{overview.digitalTwin.metrics}</div>
                <p className="text-sm text-muted-foreground">Metrics</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">{overview.digitalTwin.departments}</div>
                <p className="text-sm text-muted-foreground">Departments</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">{overview.digitalTwin.processes}</div>
                <p className="text-sm text-muted-foreground">Processes</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">{overview.activeSimulations}</div>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">{overview.completedSimulations}</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(overview.digitalTwin.lastUpdated).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <Brain className="h-4 w-4" />
          <AlertDescription>
            No digital twin found. Create one to start simulating business scenarios.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scenarios" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Scenarios
          </TabsTrigger>
          <TabsTrigger value="simulations" className="gap-2">
            <Activity className="h-4 w-4" />
            Simulations
          </TabsTrigger>
          <TabsTrigger value="decisions" className="gap-2">
            <Target className="h-4 w-4" />
            Decisions
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4">
          {/* Scenario Generator */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Scenario</CardTitle>
              <CardDescription>
                Describe a business scenario you want to simulate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="E.g., What if we expand to European markets next year with a $5M budget?"
                value={scenarioPrompt}
                onChange={(e) => setScenarioPrompt(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={generateScenario}
                disabled={generatingScenario || !scenarioPrompt.trim()}
                className="w-full gap-2"
              >
                {generatingScenario ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate AI Scenario
              </Button>
            </CardContent>
          </Card>

          {/* Scenarios List */}
          <Card>
            <CardHeader>
              <CardTitle>Available Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {overview?.scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedScenario(scenario)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold flex items-center gap-2">
                            {scenario.name}
                            <Badge variant="outline">{scenario.type}</Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Created {new Date(scenario.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${getStatusColor(scenario.status)}`} />
                          <span className="text-sm capitalize">{scenario.status}</span>
                          {scenario.status === 'ready' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                runSimulation(scenario.id)
                              }}
                              disabled={runningSimulation}
                            >
                              {runningSimulation ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!overview?.scenarios || overview.scenarios.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      No scenarios yet. Generate one above to get started.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulations" className="space-y-4">
          {simulationResult ? (
            <div className="space-y-4">
              {/* Simulation Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Simulation Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        {(simulationResult.statistics?.successRate * 100 || 0).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average ROI</p>
                      <p className="text-2xl font-bold">
                        {(simulationResult.statistics?.averageROI * 100 || 0).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Risk-Adjusted Return</p>
                      <p className="text-2xl font-bold">
                        {simulationResult.statistics?.riskAdjustedReturn?.toFixed(2) || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Iterations</p>
                      <p className="text-2xl font-bold">{simulationResult.iterations || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monte Carlo Results */}
              {simulationResult.monteCarlo && (
                <Card>
                  <CardHeader>
                    <CardTitle>Monte Carlo Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Probability of Success</p>
                          <Progress 
                            value={simulationResult.monteCarlo.probabilityOfSuccess * 100} 
                            className="mt-2"
                          />
                          <p className="text-sm mt-1">
                            {(simulationResult.monteCarlo.probabilityOfSuccess * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Value at Risk (95%)</p>
                          <p className="text-xl font-semibold">
                            ${(simulationResult.monteCarlo.valueAtRisk || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">CVaR (95%)</p>
                          <p className="text-xl font-semibold">
                            ${(simulationResult.monteCarlo.conditionalValueAtRisk || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Insights */}
              {simulationResult.insights && simulationResult.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {simulationResult.insights.map((insight: any, idx: number) => (
                        <Alert key={idx}>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            <strong>{insight.title}</strong>
                            <p className="mt-1">{insight.description}</p>
                            <Badge className="mt-2" variant={
                              insight.impact === 'high' ? 'destructive' :
                              insight.impact === 'medium' ? 'default' : 'secondary'
                            }>
                              {insight.impact} impact
                            </Badge>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {simulationResult.recommendations && simulationResult.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Strategic Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {simulationResult.recommendations.map((rec: any, idx: number) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold flex items-center gap-2">
                                {rec.title}
                                <Badge variant={
                                  rec.priority === 'critical' ? 'destructive' :
                                  rec.priority === 'high' ? 'default' : 'secondary'
                                }>
                                  {rec.priority}
                                </Badge>
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {rec.description}
                              </p>
                              {rec.actions && (
                                <ul className="mt-2 space-y-1">
                                  {rec.actions.map((action: string, i: number) => (
                                    <li key={i} className="text-sm flex items-center gap-1">
                                      <ChevronRight className="h-3 w-3" />
                                      {action}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No simulation results yet. Run a scenario simulation to see results.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Decision Analysis</CardTitle>
              <CardDescription>
                Analyze the impact of strategic decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Decision impact analysis will appear here
                </p>
                <Button className="mt-4" variant="outline">
                  Create Decision Tree
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Insights</CardTitle>
              <CardDescription>
                AI-generated insights from your business data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Strategic insights will appear here after running simulations
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}