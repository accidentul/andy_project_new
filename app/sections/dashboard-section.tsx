"use client"

import { BarChart3, Package, ShoppingCart, Wallet, Gauge, ArrowUp, ArrowDown } from "lucide-react"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { LineChart } from "../components/line-chart"
import { BarChart } from "../components/bar-chart"
import { AreaChart } from "../components/area-chart"
import { Button } from "@/components/ui/button"
import { getAiSuggestions, listConnectors, seedDemoCrm } from "@/lib/api"
import { WidgetGrid } from "../components/widget-grid"
import type { Widget } from "@/hooks/use-draggable-widgets"
import { SmallWidget } from "../components/small-widget"
import { TinyWidget } from "../components/tiny-widget"
import { Card } from "@/components/ui/card"

// Update the DashboardSectionProps interface
interface DashboardSectionProps {
  subsidiary?: {
    id: string
    name: string
    region: string
    employees: number
    revenue: string
    color: string
  }
}

export default function DashboardSection({ subsidiary }: DashboardSectionProps) {
  // State for tabs and time periods
  const [activeTab, setActiveTab] = useState("accounts")
  const [mainTimePeriod, setMainTimePeriod] = useState("month")
  const [revenueTimePeriod, setRevenueTimePeriod] = useState("month")
  const [retentionTimePeriod, setRetentionTimePeriod] = useState("month")
  const [savingsTimePeriod, setSavingsTimePeriod] = useState("month")
  const [budgetTimePeriod, setBudgetTimePeriod] = useState("month")

  // Initial widgets configuration - updated to match requirements
  const initialWidgets: Widget[] = [
    {
      id: "performance-dashboard",
      title: "Performance Dashboard",
      size: "large",
      order: 0,
    },
    {
      id: "revenue",
      title: "Revenue",
      size: "medium",
      order: 1,
    },
    {
      id: "customer-retention",
      title: "Customer Retention",
      size: "medium",
      order: 2,
    },
    {
      id: "operational-cost-savings",
      title: "Operational Cost Savings",
      size: "medium",
      order: 3,
    },
    {
      id: "budget-utilization",
      title: "Budget Utilization",
      size: "medium",
      order: 4,
    },
    {
      id: "system-status",
      title: "System Status",
      size: "small",
      order: 5,
    },
  ]

  // AI Suggested widgets from backend CRM aggregation
  const [aiWidgets, setAiWidgets] = useState<Widget[]>([])
  const [aiWidgetData, setAiWidgetData] = useState<Record<string, any>>({})
  
  // Ensure demo data exists, then fetch AI suggestions
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // Ensure at least one connector exists and seed demo data if needed
        const connectors = await listConnectors().catch(() => [])
        const connector = connectors[0]
        if (connector) {
          await seedDemoCrm(connector.id, connector.provider)
          // seed extra volume
          await seedDemoCrm(connector.id, connector.provider)
        }

        const res = await getAiSuggestions()
        if (cancelled) return
        
        // Store the data for each widget
        const dataMap: Record<string, any> = {}
        res.suggestions.forEach((s) => {
          dataMap[`ai-${s.id}`] = {
            type: s.type,
            data: s.data,
            description: s.description
          }
        })
        setAiWidgetData(dataMap)
        
        const widgets: Widget[] = res.suggestions.slice(0, 4).map((s, idx) => ({
          id: `ai-${s.id}`,
          title: s.title,
          size: s.size === 'tiny' || s.size === 'small' ? 'small' : 'medium',
          order: 100 + idx,
        }))
        setAiWidgets(widgets)
      } catch (e) {
        // ignore if AI backend not ready
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Get subsidiary-specific data
  const getSubsidiaryData = () => {
    // Default data (global company)
    let data = {
      chartColor: "#c44ed9", // purple
      accountsData: [
        { month: "JAN", value: 100, prevYear: 80 },
        { month: "FEB", value: 70, prevYear: 60 },
        { month: "MAR", value: 90, prevYear: 75 },
        { month: "APR", value: 70, prevYear: 65 },
        { month: "MAY", value: 85, prevYear: 70 },
        { month: "JUN", value: 60, prevYear: 55 },
        { month: "JUL", value: 75, prevYear: 65 },
        { month: "AUG", value: 60, prevYear: 50 },
        { month: "SEP", value: 90, prevYear: 75 },
        { month: "OCT", value: 80, prevYear: 70 },
        { month: "NOV", value: 100, prevYear: 85 },
        { month: "DEC", value: 90, prevYear: 80 },
      ],
      purchasesData: [
        { month: "JAN", value: 12500, prevYear: 10200 },
        { month: "FEB", value: 8700, prevYear: 7500 },
        { month: "MAR", value: 15400, prevYear: 12800 },
        { month: "APR", value: 9800, prevYear: 8900 },
        { month: "MAY", value: 14200, prevYear: 11500 },
        { month: "JUN", value: 11000, prevYear: 9800 },
        { month: "JUL", value: 13500, prevYear: 11200 },
        { month: "AUG", value: 10800, prevYear: 9500 },
        { month: "SEP", value: 16700, prevYear: 13800 },
        { month: "OCT", value: 18200, prevYear: 14500 },
        { month: "NOV", value: 21500, prevYear: 16800 },
        { month: "DEC", value: 24800, prevYear: 19200 },
      ],
    }

    // Subsidiary-specific data
    if (subsidiary) {
      switch (subsidiary.id) {
        case "us":
          data = {
            chartColor: "#3b82f6", // blue
            accountsData: [
              { month: "JAN", value: 85, prevYear: 70 },
              { month: "FEB", value: 60, prevYear: 50 },
              { month: "MAR", value: 75, prevYear: 65 },
              { month: "APR", value: 60, prevYear: 55 },
              { month: "MAY", value: 70, prevYear: 60 },
              { month: "JUN", value: 50, prevYear: 45 },
              { month: "JUL", value: 65, prevYear: 55 },
              { month: "AUG", value: 50, prevYear: 40 },
              { month: "SEP", value: 75, prevYear: 65 },
              { month: "OCT", value: 70, prevYear: 60 },
              { month: "NOV", value: 85, prevYear: 75 },
              { month: "DEC", value: 75, prevYear: 65 },
            ],
            purchasesData: [
              { month: "JAN", value: 10500, prevYear: 8500 },
              { month: "FEB", value: 7200, prevYear: 6200 },
              { month: "MAR", value: 12800, prevYear: 10500 },
              { month: "APR", value: 8200, prevYear: 7400 },
              { month: "MAY", value: 11800, prevYear: 9600 },
              { month: "JUN", value: 9200, prevYear: 8200 },
              { month: "JUL", value: 11200, prevYear: 9300 },
              { month: "AUG", value: 9000, prevYear: 7900 },
              { month: "SEP", value: 13900, prevYear: 11500 },
              { month: "OCT", value: 15200, prevYear: 12100 },
              { month: "NOV", value: 17900, prevYear: 14000 },
              { month: "DEC", value: 20700, prevYear: 16000 },
            ],
          }
          break
        // Other subsidiaries...
        default:
          break
      }
    }

    return data
  }

  const subsidiaryData = getSubsidiaryData()

  // Get quarterly data for performance dashboard
  const getQuarterlyData = () => {
    return [
      { month: "Q1", value: 260, prevYear: 215 },
      { month: "Q2", value: 215, prevYear: 190 },
      { month: "Q3", value: 225, prevYear: 190 },
      { month: "Q4", value: 270, prevYear: 235 },
    ]
  }

  // Calculate performance metrics
  const calculatePerformanceMetrics = () => {
    const quarterlyData = getQuarterlyData()
    const currentValue = quarterlyData[3].value // Q4 value
    const previousValue = quarterlyData[2].value // Q3 value
    const percentChange = ((currentValue - previousValue) / previousValue) * 100
    const yearlyChange = ((currentValue - quarterlyData[3].prevYear) / quarterlyData[3].prevYear) * 100

    return {
      current: currentValue,
      previous: previousValue,
      percentChange,
      yearlyChange,
      isPositive: percentChange >= 0,
      isYearlyPositive: yearlyChange >= 0,
    }
  }

  const performanceMetrics = calculatePerformanceMetrics()

  // Add a useEffect to handle mobile resizing
  useEffect(() => {
    const handleResize = () => {
      // Force a re-render when window size changes to update mobile layout
      setMainTimePeriod(mainTimePeriod)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [mainTimePeriod])

  // Grid-Aware Performance Dashboard Component
  const GridAwarePerformanceDashboard = ({ widget }: { widget: Widget }) => {
    // Use grid dimensions to determine display mode
    const gridWidth = widget.gridWidth || 1
    const gridHeight = widget.gridHeight || 1

    // Calculate total grid cells (area)
    const gridArea = gridWidth * gridHeight

    // Determine display mode based on grid dimensions and mobile status
    const isMobile = window.innerWidth < 768
    let displayMode: "micro" | "tiny" | "small" | "medium" | "large" = "large"

    if (isMobile) {
      // On mobile, use medium or large display mode to show more content
      displayMode = gridArea <= 2 ? "medium" : "large"
    } else {
      // On desktop, use the normal sizing logic
      if (gridArea <= 1) {
        displayMode = "micro"
      } else if (gridArea <= 2) {
        displayMode = "tiny"
      } else if (gridArea <= 6) {
        displayMode = "small"
      } else if (gridArea <= 12) {
        displayMode = "medium"
      } else {
        displayMode = "large"
      }
    }

    // Micro display mode - absolute minimum (1x1)
    if (displayMode === "micro") {
      return (
        <div className="h-full w-full p-1 flex flex-col justify-center items-center">
          <div className="text-xs font-medium mb-0.5 truncate w-full text-center">Perf</div>
          <div className="text-lg font-bold">{performanceMetrics.current}</div>
        </div>
      )
    }

    // Tiny display mode - just key metrics (1x2 or 2x1)
    if (displayMode === "tiny") {
      return (
        <div className="h-full w-full p-2 flex flex-col justify-center items-center">
          <div className="text-xs text-muted-foreground font-medium mb-1 truncate w-full text-center">Performance</div>
          <div className="text-xl font-bold">{performanceMetrics.current}</div>
          <div className={`flex items-center ${performanceMetrics.isPositive ? "text-green-500" : "text-red-500"}`}>
            {performanceMetrics.isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            <span className="text-xs ml-1">{Math.abs(performanceMetrics.percentChange).toFixed(1)}%</span>
          </div>
        </div>
      )
    }

    // Small display mode - key metrics with mini chart (2x2 or 3x2)
    if (displayMode === "small") {
      return (
        <div className="h-full w-full p-3 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">Performance</div>
            <div className={`flex items-center ${performanceMetrics.isPositive ? "text-green-500" : "text-red-500"}`}>
              {performanceMetrics.isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              <span className="text-xs ml-1">{Math.abs(performanceMetrics.percentChange).toFixed(1)}%</span>
            </div>
          </div>

          <div className="flex-grow flex items-center">
            <div className="flex-1">
              <div className="text-2xl font-bold">{performanceMetrics.current}</div>
              <div className="text-xs text-muted-foreground">vs prev: {performanceMetrics.previous}</div>
            </div>

            {gridWidth >= 2 && gridHeight >= 2 && (
              <div className="w-16 h-16">
                <AreaChart
                  color={subsidiaryData.chartColor}
                  data={getQuarterlyData()}
                  minimal={true}
                  title="Performance"
                />
              </div>
            )}
          </div>

          {gridWidth >= 3 && gridHeight >= 2 && (
            <div className="text-xs text-muted-foreground mt-2 truncate">
              <span className="font-medium text-primary">Insight:</span>{" "}
              {performanceMetrics.isPositive ? "Positive" : "Negative"} trend in Q4
            </div>
          )}
        </div>
      )
    }

    // Medium display mode - more detailed metrics and chart (3x3 or 4x3)
    if (displayMode === "medium") {
      return (
        <div className="h-full w-full flex flex-col">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Performance Dashboard</CardTitle>
              {gridWidth >= 3 && (
                <Tabs defaultValue="quarter" className="self-end">
                  <TabsList className="bg-secondary h-7">
                    <TabsTrigger
                      value="quarter"
                      className="text-xs h-5 px-2 data-[state=active]:bg-primary data-[state=active]:text-white"
                    >
                      Quarterly
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 flex-grow flex flex-col">
            <div className="flex-grow" style={{ minHeight: "100px" }}>
              <LineChart
                color={subsidiaryData.chartColor}
                data={getQuarterlyData()}
                showPrevYear={gridWidth >= 3}
                valueFormatter={(value) => `${value}`}
                compareLabel="Previous Year"
                title="Performance"
                minimal={gridWidth < 3 || gridHeight < 3}
              />
            </div>

            {gridHeight >= 3 && (
              <div className="mt-3 pt-2 border-t border-border">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">vs Previous Quarter</div>
                    <div
                      className={`text-sm font-medium flex items-center ${performanceMetrics.isPositive ? "text-green-500" : "text-red-500"}`}
                    >
                      {performanceMetrics.isPositive ? (
                        <ArrowUp size={14} className="mr-1" />
                      ) : (
                        <ArrowDown size={14} className="mr-1" />
                      )}
                      {Math.abs(performanceMetrics.percentChange).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">vs Previous Year</div>
                    <div
                      className={`text-sm font-medium flex items-center ${performanceMetrics.isYearlyPositive ? "text-green-500" : "text-red-500"}`}
                    >
                      {performanceMetrics.isYearlyPositive ? (
                        <ArrowUp size={14} className="mr-1" />
                      ) : (
                        <ArrowDown size={14} className="mr-1" />
                      )}
                      {Math.abs(performanceMetrics.yearlyChange).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </div>
      )
    }

    // Large display mode - full dashboard (5x4 or larger)
    return (
      <div className="h-full w-full flex flex-col">
        <CardHeader className="flex flex-col space-y-3 pb-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-xl sm:text-2xl">Performance Dashboard</CardTitle>
          </div>
          <div className="flex flex-col space-y-3 sm:space-y-2 sm:items-end">
            <Tabs
              defaultValue="accounts"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full sm:w-auto sm:mr-8"
            >
              <TabsList className="w-full grid grid-cols-3 sm:w-auto sm:flex">
                <TabsTrigger
                  value="accounts"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm"
                >
                  Accounts
                </TabsTrigger>
                <TabsTrigger
                  value="purchases"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm"
                >
                  Purchases
                </TabsTrigger>
                <TabsTrigger
                  value="sessions"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm"
                >
                  Sessions
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs
              defaultValue="month"
              value={mainTimePeriod}
              onValueChange={setMainTimePeriod}
              className="self-end sm:mr-8"
            >
              <TabsList className="bg-secondary h-7">
                <TabsTrigger
                  value="month"
                  className="text-xs h-5 px-2 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  Monthly
                </TabsTrigger>
                <TabsTrigger
                  value="quarter"
                  className="text-xs h-5 px-2 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  Quarterly
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          <div className="flex-grow" style={{ minHeight: "200px" }}>
            {activeTab === "accounts" && (
              <LineChart
                color={subsidiaryData.chartColor}
                data={mainTimePeriod === "month" ? subsidiaryData.accountsData : getQuarterlyData()}
                showPrevYear={false}
                valueFormatter={(value) => `${value}`}
              />
            )}
            {activeTab === "purchases" && (
              <LineChart
                color={subsidiaryData.chartColor}
                data={
                  mainTimePeriod === "month"
                    ? subsidiaryData.purchasesData
                    : [
                        { month: "Q1", value: 36600, prevYear: 30500 },
                        { month: "Q2", value: 35000, prevYear: 30200 },
                        { month: "Q3", value: 41000, prevYear: 34500 },
                        { month: "Q4", value: 64500, prevYear: 50500 },
                      ]
                }
                showPrevYear={true}
                valueFormatter={(value) => `$${value.toLocaleString()}`}
              />
            )}
            {activeTab === "sessions" && (
              <LineChart
                color="#14b8a6"
                data={
                  mainTimePeriod === "month"
                    ? [
                        { month: "JAN", value: 4250, prevYear: 3800 },
                        { month: "FEB", value: 3800, prevYear: 3200 },
                        { month: "MAR", value: 5100, prevYear: 4300 },
                        { month: "APR", value: 4700, prevYear: 4100 },
                        { month: "MAY", value: 5300, prevYear: 4500 },
                        { month: "JUN", value: 4900, prevYear: 4200 },
                        { month: "JUL", value: 5500, prevYear: 4700 },
                        { month: "AUG", value: 5100, prevYear: 4400 },
                        { month: "SEP", value: 6200, prevYear: 5100 },
                        { month: "OCT", value: 5800, prevYear: 4900 },
                        { month: "NOV", value: 6500, prevYear: 5300 },
                        { month: "DEC", value: 7200, prevYear: 5800 },
                      ]
                    : [
                        { month: "Q1", value: 13150, prevYear: 11300 },
                        { month: "Q2", value: 14900, prevYear: 12800 },
                        { month: "Q3", value: 16800, prevYear: 14200 },
                        { month: "Q4", value: 19500, prevYear: 16000 },
                      ]
                }
                showPrevYear={false}
                valueFormatter={(value) => `${value.toLocaleString()}`}
              />
            )}
          </div>

          {gridHeight >= 4 && (
            <div className="mt-4 pt-3 border-t border-border">
              {activeTab === "accounts" && (
                <>
                  <div className="text-xs text-muted-foreground mb-2">
                    <span className="font-medium text-primary">Quick Insight:</span> New account creation increased by
                    18% in Q4 compared to Q3
                  </div>
                  <div className="text-xs text-muted-foreground mb-2 flex items-start">
                    <span className="font-medium text-green-500 mr-1">AI Recommendation:</span>
                    <span>
                      Implement streamlined onboarding flow to capitalize on growth trend and improve conversion by an
                      estimated 12%
                    </span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    Optimize Onboarding
                  </Button>
                </>
              )}
              {activeTab === "purchases" && (
                <>
                  <div className="text-xs text-muted-foreground mb-2">
                    <span className="font-medium text-blue-500">Quick Insight:</span> Q4 purchases exceeded previous
                    year by 25%, with December showing strongest growth
                  </div>
                  <div className="text-xs text-muted-foreground mb-2 flex items-start">
                    <span className="font-medium text-green-500 mr-1">AI Recommendation:</span>
                    <span>
                      Increase inventory for top-selling products by 30% for Q1 to meet projected demand growth
                    </span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    View Purchase Trends
                  </Button>
                </>
              )}
              {activeTab === "sessions" && (
                <>
                  <div className="text-xs text-muted-foreground mb-2">
                    <span className="font-medium text-teal-500">Quick Insight:</span> Average session duration increased
                    15% while bounce rate decreased 8%
                  </div>
                  <div className="text-xs text-muted-foreground mb-2 flex items-start">
                    <span className="font-medium text-green-500 mr-1">AI Recommendation:</span>
                    <span>
                      Optimize product recommendation algorithm to further increase engagement metrics by an estimated
                      22%
                    </span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    Analyze User Behavior
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </div>
    )
  }

  // Render widget content based on widget ID
  const renderWidget = (widget: Widget) => {
    // AI-suggested widget rendering with actual data
    if (widget.id.startsWith('ai-')) {
      const widgetInfo = aiWidgetData[widget.id]
      
      if (!widgetInfo || !widgetInfo.data) {
        return (
          <Card className="h-full w-full overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">Loading...</div>
            </CardContent>
          </Card>
        )
      }

      // Render based on widget type
      if (widgetInfo.type === 'kpi') {
        return (
          <Card className="h-full w-full overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{widget.title}</CardTitle>
              <div className="text-xs text-muted-foreground">{widgetInfo.description}</div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {widget.title.includes('Pipeline') ? 
                    `$${(widgetInfo.data.value / 1000000).toFixed(2)}M` : 
                    widget.title.includes('Ratio') ?
                    `${widgetInfo.data.value}%` :
                    widgetInfo.data.value
                  }
                </div>
                <div className="text-green-500">
                  <ArrowUp className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      }

      if (widgetInfo.type === 'line') {
        const chartData = Array.isArray(widgetInfo.data) ? widgetInfo.data : []
        return (
          <Card className="h-full w-full overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{widget.title}</CardTitle>
              <div className="text-xs text-muted-foreground">{widgetInfo.description}</div>
            </CardHeader>
            <CardContent className="h-[200px]">
              <LineChart 
                data={chartData.map((item: any) => ({
                  month: item.day ? new Date(item.day).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : 'N/A',
                  value: item.value || 0
                }))}
                height={180}
                color="#c44ed9"
              />
            </CardContent>
          </Card>
        )
      }

      if (widgetInfo.type === 'bar') {
        const chartData = Array.isArray(widgetInfo.data) ? widgetInfo.data : []
        return (
          <Card className="h-full w-full overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{widget.title}</CardTitle>
              <div className="text-xs text-muted-foreground">{widgetInfo.description}</div>
            </CardHeader>
            <CardContent className="h-[200px]">
              <BarChart 
                data={chartData.map((item: any) => ({
                  month: item.stage || item.month || 'N/A',
                  value: item.value || 0
                }))}
                height={180}
                color="#c44ed9"
              />
            </CardContent>
          </Card>
        )
      }

      if (widgetInfo.type === 'area') {
        const chartData = Array.isArray(widgetInfo.data) ? widgetInfo.data : []
        return (
          <Card className="h-full w-full overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{widget.title}</CardTitle>
              <div className="text-xs text-muted-foreground">{widgetInfo.description}</div>
            </CardHeader>
            <CardContent className="h-[200px]">
              <AreaChart 
                data={chartData.map((item: any) => ({
                  month: item.month || 'N/A',
                  value: item.value || 0
                }))}
                height={180}
                color="#c44ed9"
              />
            </CardContent>
          </Card>
        )
      }

      // Fallback for unknown types
      return (
        <Card className="h-full w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{widget.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">AI-suggested widget</div>
            <div className="text-sm mt-2">{JSON.stringify(widgetInfo.data).slice(0, 100)}...</div>
          </CardContent>
        </Card>
      )
    }

    switch (widget.id) {
      case "performance-dashboard":
        return (
          <Card className="h-full w-full overflow-hidden">
            <GridAwarePerformanceDashboard widget={widget} />
          </Card>
        )

      case "revenue":
        if (widget.size === "tiny") {
          return (
            <TinyWidget
              title="Revenue"
              value="$1.24M"
              icon={<Package className="h-4 w-4 text-purple-500" />}
              color="purple"
            />
          )
        }

        if (widget.size === "small") {
          return (
            <SmallWidget
              title="Revenue"
              value="$1.24M"
              icon={<Package className="h-5 w-5 text-purple-500" />}
              color="purple"
            />
          )
        }

        return (
          <>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <div className="text-sm text-muted-foreground">Revenue</div>
              </div>
              <CardTitle className="text-2xl text-primary">$1.24M</CardTitle>
              <div className="flex justify-end mt-1">
                <Tabs defaultValue="month" value={revenueTimePeriod} onValueChange={setRevenueTimePeriod}>
                  <TabsList className="bg-secondary h-6">
                    <TabsTrigger
                      value="month"
                      className="text-xs h-4 px-2 data-[state=active]:bg-primary data-[state=active]:text-white"
                    >
                      M
                    </TabsTrigger>
                    <TabsTrigger
                      value="quarter"
                      className="text-xs h-4 px-2 data-[state=active]:bg-primary data-[state=active]:text-white"
                    >
                      Q
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[120px] sm:h-[150px]">
                <LineChart
                  color="#c44ed9"
                  data={
                    revenueTimePeriod === "month"
                      ? [
                          { month: "JUL", value: 80 },
                          { month: "AUG", value: 100 },
                          { month: "SEP", value: 70 },
                          { month: "OCT", value: 80 },
                          { month: "NOV", value: 120 },
                          { month: "DEC", value: 80 },
                        ]
                      : [
                          { month: "Q1", value: 220 },
                          { month: "Q2", value: 180 },
                          { month: "Q3", value: 250 },
                          { month: "Q4", value: 280 },
                        ]
                  }
                  title="Revenue"
                  gridWidth={widget.gridWidth || 3}
                  gridHeight={widget.gridHeight || 3}
                />
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground mb-2">
                  <span className="font-medium text-primary">Quick Insight:</span> Revenue growth trending 8% above
                  forecast
                </div>
                <div className="text-xs text-muted-foreground mb-2 flex items-start">
                  <span className="font-medium text-green-500 mr-1">AI Recommendation:</span>
                  <span>Allocate 15% more resources to top-performing channels to maximize ROI</span>
                </div>
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Explore Growth Opportunities
                </Button>
              </div>
            </CardContent>
          </>
        )

      case "customer-retention":
        if (widget.size === "tiny") {
          return (
            <TinyWidget
              title="Retention"
              value="94.2%"
              icon={<ShoppingCart className="h-4 w-4 text-blue-500" />}
              color="blue"
            />
          )
        }

        if (widget.size === "small") {
          return (
            <SmallWidget
              title="Customer Retention"
              value="94.2%"
              icon={<ShoppingCart className="h-5 w-5 text-blue-500" />}
              color="blue"
            />
          )
        }

        return (
          <>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
                <div className="text-sm text-muted-foreground">Customer Retention</div>
              </div>
              <CardTitle className="text-2xl text-blue-500">94.2%</CardTitle>
              <div className="flex justify-end mt-1">
                <Tabs defaultValue="month" value={retentionTimePeriod} onValueChange={setRetentionTimePeriod}>
                  <TabsList className="bg-secondary h-6">
                    <TabsTrigger
                      value="month"
                      className="text-xs h-4 px-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                    >
                      M
                    </TabsTrigger>
                    <TabsTrigger
                      value="quarter"
                      className="text-xs h-4 px-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                    >
                      Q
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[120px] sm:h-[150px]">
                <BarChart
                  color="#3b82f6"
                  data={
                    retentionTimePeriod === "month"
                      ? [
                          { country: "USA", value: 50 },
                          { country: "GER", value: 20 },
                          { country: "AUS", value: 15 },
                          { country: "UK", value: 70 },
                          { country: "RO", value: 100 },
                          { country: "BR", value: 45 },
                        ]
                      : [
                          { country: "Q1", value: 65 },
                          { country: "Q2", value: 75 },
                          { country: "Q3", value: 85 },
                          { country: "Q4", value: 95 },
                        ]
                  }
                  title="Customer Retention"
                  gridWidth={widget.gridWidth || 3}
                  gridHeight={widget.gridHeight || 3}
                />
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground mb-2">
                  <span className="font-medium text-blue-500">Quick Insight:</span> UK market shows highest retention
                  rate
                </div>
                <div className="text-xs text-muted-foreground mb-2 flex items-start">
                  <span className="font-medium text-green-500 mr-1">AI Recommendation:</span>
                  <span>Apply UK retention strategies to German market to improve by estimated 35%</span>
                </div>
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Analyze Success Factors
                </Button>
              </div>
            </CardContent>
          </>
        )

      case "operational-cost-savings":
        if (widget.size === "tiny") {
          return (
            <TinyWidget
              title="Savings"
              value="$428K"
              icon={<BarChart3 className="h-4 w-4 text-teal-500" />}
              color="teal"
            />
          )
        }

        if (widget.size === "small") {
          return (
            <SmallWidget
              title="Cost Savings"
              value="$428K"
              icon={<BarChart3 className="h-5 w-5 text-teal-500" />}
              color="teal"
            />
          )
        }

        return (
          <>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-teal-500" />
                <div className="text-sm text-muted-foreground">Operational Cost Savings</div>
              </div>
              <CardTitle className="text-2xl text-teal-500">$428K</CardTitle>
              <div className="flex justify-end mt-1">
                <Tabs defaultValue="month" value={savingsTimePeriod} onValueChange={setSavingsTimePeriod}>
                  <TabsList className="bg-secondary h-6">
                    <TabsTrigger
                      value="month"
                      className="text-xs h-4 px-2 data-[state=active]:bg-teal-500 data-[state=active]:text-white"
                    >
                      M
                    </TabsTrigger>
                    <TabsTrigger
                      value="quarter"
                      className="text-xs h-4 px-2 data-[state=active]:bg-teal-500 data-[state=active]:text-white"
                    >
                      Q
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[120px] sm:h-[150px]">
                <AreaChart
                  color="#14b8a6"
                  data={
                    savingsTimePeriod === "month"
                      ? [
                          { month: "JUL", value: 90 },
                          { month: "AUG", value: 30 },
                          { month: "SEP", value: 70 },
                          { month: "OCT", value: 20 },
                          { month: "NOV", value: 85 },
                        ]
                      : [
                          { month: "Q1", value: 120 },
                          { month: "Q2", value: 95 },
                          { month: "Q3", value: 190 },
                          { month: "Q4", value: 145 },
                        ]
                  }
                  title="Cost Savings"
                  gridWidth={widget.gridWidth || 3}
                  gridHeight={widget.gridHeight || 3}
                />
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground mb-2">
                  <span className="font-medium text-teal-500">Quick Insight:</span> Cost reduction of 8.5% achieved this
                  quarter
                </div>
                <div className="text-xs text-muted-foreground mb-2 flex items-start">
                  <span className="font-medium text-green-500 mr-1">AI Recommendation:</span>
                  <span>Automate inventory management to reduce operational costs by additional 12%</span>
                </div>
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Optimize Further
                </Button>
              </div>
            </CardContent>
          </>
        )

      case "budget-utilization":
        if (widget.size === "tiny") {
          return (
            <TinyWidget
              title="Budget"
              value="82.5%"
              icon={<Wallet className="h-4 w-4 text-green-600" />}
              color="green"
            />
          )
        }

        if (widget.size === "small") {
          return (
            <SmallWidget
              title="Budget Utilization"
              value="82.5%"
              icon={<Wallet className="h-5 w-5 text-green-600" />}
              color="green"
            />
          )
        }

        return (
          <>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-green-600" />
                <div className="text-sm text-muted-foreground">Budget Utilization</div>
              </div>
              <CardTitle className="text-2xl text-green-600">82.5%</CardTitle>
              <div className="flex justify-end mt-1">
                <Tabs defaultValue="month" value={budgetTimePeriod} onValueChange={setBudgetTimePeriod}>
                  <TabsList className="bg-secondary h-6">
                    <TabsTrigger
                      value="month"
                      className="text-xs h-4 px-2 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                    >
                      M
                    </TabsTrigger>
                    <TabsTrigger
                      value="quarter"
                      className="text-xs h-4 px-2 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                    >
                      Q
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[120px] sm:h-[150px]">
                <div className="text-xs text-muted-foreground mb-2">Department Budget Utilization ($)</div>
                <BarChart
                  color="#16a34a"
                  data={
                    budgetTimePeriod === "month"
                      ? [
                          { country: "Marketing", value: 125000 },
                          { country: "R&D", value: 180000 },
                          { country: "Sales", value: 145000 },
                          { country: "IT", value: 95000 },
                          { country: "HR", value: 65000 },
                          { country: "Ops", value: 110000 },
                        ]
                      : [
                          { country: "Marketing", value: 375000 },
                          { country: "R&D", value: 520000 },
                          { country: "Sales", value: 420000 },
                          { country: "IT", value: 280000 },
                          { country: "HR", value: 190000 },
                          { country: "Ops", value: 330000 },
                        ]
                  }
                  valueFormatter={(value) => `$${value.toLocaleString()}`}
                  title="Budget Utilization"
                  gridWidth={widget.gridWidth || 3}
                  gridHeight={widget.gridHeight || 3}
                />
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground mb-2">
                  <span className="font-medium text-green-600">Quick Insight:</span> Budget utilization trending 5%
                  below forecast, indicating efficient resource allocation
                </div>
                <div className="text-xs text-muted-foreground mb-2 flex items-start">
                  <span className="font-medium text-green-500 mr-1">AI Recommendation:</span>
                  <span>Reallocate 8% of Q1 budget to high-growth initiatives in marketing and R&D</span>
                </div>
                <Button size="sm" variant="outline" className="w-full text-xs">
                  View Budget Details
                </Button>
              </div>
            </CardContent>
          </>
        )

      case "system-status":
        if (widget.size === "tiny") {
          return (
            <TinyWidget
              title="Status"
              value="95%"
              icon={<Gauge className="h-3 w-3 text-purple-500" />}
              color="purple"
            />
          )
        }

        if (widget.size === "small") {
          return (
            <SmallWidget
              title="System Status"
              value="95%"
              icon={<Gauge className="h-4 w-4 text-purple-500" />}
              color="purple"
            />
          )
        }

        return (
          <>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm">AI Processing</div>
                    <div className="text-sm text-primary">68%</div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "68%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm">Data Quality</div>
                    <div className="text-sm text-blue-500">92%</div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "92%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm">Security</div>
                    <div className="text-sm text-teal-500">95%</div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: "95%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm">Cost Efficiency</div>
                    <div className="text-sm text-amber-500">78%</div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: "78%" }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )

      default:
        return (
          <CardContent>
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Widget content not available</p>
            </div>
          </CardContent>
        )
    }
  }

  return (
    <div className="bg-background dark:bg-gray-900">
      <WidgetGrid
        initialWidgets={[...initialWidgets, ...aiWidgets]}
        renderWidget={renderWidget}
        onCustomizeWidget={(widget) => {
          console.log("Customize widget:", widget.id)
        }}
      />
    </div>
  )
}

