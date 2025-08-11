"use client"

import { useState, useEffect } from "react"
import {
  Activity,
  AlertCircle,
  BarChart,
  Bell,
  Brain,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  Command,
  CpuIcon,
  Database,
  DollarSign,
  Globe,
  LineChart,
  Lock,
  MessageSquare,
  Moon,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Settings,
  Shield,
  Sun,
  Terminal,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
  CircleOff,
  PieChart,
} from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"

// Mock data
const mockMetrics = {
  revenue: { value: "$1.24M", change: "+12.4%", trend: "up" },
  retention: { value: "94.2%", change: "+2.8%", trend: "up" },
  costs: { value: "$428K", change: "-8.5%", trend: "down" },
  performance: { value: "98.2%", change: "+1.5%", trend: "up" },
  activeUsers: { value: "2,847", change: "+124", trend: "up" },
  aiOperations: { value: "1.2M", change: "+18%", trend: "up" },
  securityIncidents: { value: "0", change: "0", trend: "stable" },
  responseTime: { value: "42ms", change: "-8ms", trend: "down" },
}

const mockInsights = [
  {
    id: 1,
    title: "Customer Behavior Pattern",
    description: "Premium customers are 3.2x more likely to purchase after viewing educational content",
    impact: "+$32,400 revenue opportunity",
    type: "opportunity",
    time: "2 hours ago",
  },
  {
    id: 2,
    title: "Pricing Elasticity Analysis",
    description: "7 products have room for 5-12% price increases without affecting demand",
    impact: "+$48,500 projected revenue",
    type: "opportunity",
    time: "4 hours ago",
  },
  {
    id: 3,
    title: "Unusual Website Traffic",
    description: "42% increase in mobile traffic from new geographic region",
    impact: "Investigate marketing attribution",
    type: "anomaly",
    time: "1 hour ago",
  },
  {
    id: 4,
    title: "Inventory Depletion Rate",
    description: "SKU-78X depleting 3x faster than forecast",
    impact: "Reorder recommended",
    type: "anomaly",
    time: "30 minutes ago",
  },
]

const mockActions = [
  {
    id: 1,
    title: "Customer Churn Prevention",
    description: "Identified 24 high-risk customers and initiated personalized retention campaigns",
    status: "completed",
    time: "2 hours ago",
    impact: "+$45,200 projected revenue saved",
  },
  {
    id: 2,
    title: "Inventory Optimization",
    description: "Adjusted stock levels for 15 products based on seasonal demand forecast",
    status: "in_progress",
    time: "Ongoing",
    impact: "-$12,400 in carrying costs",
  },
  {
    id: 3,
    title: "Marketing Budget Reallocation",
    description: "Shifted $5,000 from underperforming channels to high-ROI campaigns",
    status: "pending_approval",
    time: "Awaiting approval",
    impact: "+$18,500 projected revenue",
  },
]

const mockUsers = [
  { id: 1, name: "John Doe", role: "Admin", status: "Active", avatar: "JD" },
  { id: 2, name: "Sarah Chen", role: "Analyst", status: "Active", avatar: "SC" },
  { id: 3, name: "Miguel Rodriguez", role: "Developer", status: "Away", avatar: "MR" },
  { id: 4, name: "Aisha Johnson", role: "Manager", status: "Active", avatar: "AJ" },
]

const mockDataSources = [
  { id: 1, name: "CRM System", status: "Connected", lastSync: "5 min ago", dataPoints: "12.4K records" },
  { id: 2, name: "ERP Database", status: "Connected", lastSync: "12 min ago", dataPoints: "8.7K records" },
  { id: 3, name: "Marketing Platform", status: "Connected", lastSync: "3 min ago", dataPoints: "5.2K records" },
  { id: 4, name: "E-commerce Store", status: "Connected", lastSync: "8 min ago", dataPoints: "24.8K records" },
]

export default function Dashboard() {
  const [version, setVersion] = useState<"v1" | "v2" | "v3">("v1")
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [aiProcessing, setAiProcessing] = useState(68)
  const [dataQuality, setDataQuality] = useState(92)
  const [securityLevel, setSecurityLevel] = useState(95)
  const [costEfficiency, setCostEfficiency] = useState(78)
  const [activeTab, setActiveTab] = useState("overview")
  const [automatedActions, setAutomatedActions] = useState(mockActions)
  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState([
    {
      role: "system",
      content: "Hello! I'm ANDI, your Adaptive Neural Data Intelligence assistant. How can I help you today?",
    },
  ])
  const [isTyping, setIsTyping] = useState(false)

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Simulate changing data
  useEffect(() => {
    const interval = setInterval(() => {
      setAiProcessing(Math.floor(Math.random() * 15) + 60)
      setDataQuality(Math.floor(Math.random() * 10) + 85)
      setCostEfficiency(Math.floor(Math.random() * 15) + 70)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Handle chat input
  const handleChatSubmit = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    // Add user message
    const userMessage = {
      role: "user",
      content: chatInput,
    }
    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      let response = ""

      if (chatInput.toLowerCase().includes("sales") && chatInput.toLowerCase().includes("down")) {
        response =
          "Based on my analysis, sales are down 12% this quarter primarily due to three factors:\n\n1. Seasonal fluctuations (contributing ~40% of the decline)\n2. Increased competitor activity in your core markets (contributing ~35%)\n3. Supply chain disruptions affecting product availability (contributing ~25%)\n\nWould you like me to generate a detailed report with recommendations to address these issues?"
      } else if (
        chatInput.toLowerCase().includes("increase") &&
        (chatInput.toLowerCase().includes("revenue") || chatInput.toLowerCase().includes("sales"))
      ) {
        response =
          "To increase revenue, I recommend these data-driven actions:\n\n1. Implement targeted promotions for your top 20% customers who haven't purchased in 30+ days\n2. Optimize pricing for products with high elasticity - I've identified 5 products with potential for 5-8% price increases\n3. Reallocate $15,000 from underperforming marketing channels to high-ROI campaigns\n\nShall I initiate any of these actions for you?"
      } else if (chatInput.toLowerCase().includes("customer") && chatInput.toLowerCase().includes("churn")) {
        response =
          "I've identified 24 high-risk customers likely to churn in the next 30 days. The primary indicators are:\n\n- Decreased engagement (avg. -45%)\n- Support ticket increases (+28%)\n- Reduced product usage (-32%)\n\nI've already initiated personalized retention campaigns for these customers. Would you like to review the automated actions I've taken?"
      } else {
        response =
          "I've analyzed your question and can provide insights based on your business data. Would you like me to generate a report, suggest actions, or provide more specific analysis on this topic?"
      }

      const aiMessage = {
        role: "system",
        content: response,
      }
      setChatMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 2000)
  }

  const handleApproveAction = (id) => {
    setAutomatedActions((prev) =>
      prev.map((action) => (action.id === id ? { ...action, status: "in_progress" } : action)),
    )
  }

  // Version selector component
  const VersionSelector = () => (
    <div className="fixed top-4 right-4 z-50">
      <Select value={version} onValueChange={(v) => setVersion(v)}>
        <SelectTrigger className="w-[200px] bg-black/50 border-purple-500/30 backdrop-blur-sm text-white">
          <SelectValue placeholder="Select version" />
        </SelectTrigger>
        <SelectContent className="bg-black/90 border-purple-500/30">
          <SelectItem value="v1">Version 1: Glass Panels</SelectItem>
          <SelectItem value="v2">Version 2: Minimal Insights</SelectItem>
          <SelectItem value="v3">Version 3: Command Center</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  // Version 1: Glass Panels Dashboard
  const GlassPanelsDashboard = () => {
    const [expandedPanel, setExpandedPanel] = useState(null)

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Brain className="h-8 w-8 text-purple-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-teal-400 to-blue-500 bg-clip-text text-transparent">
              ANDI
            </span>
            <span className="text-xs text-slate-400 hidden md:inline-block">Adaptive Neural Data Intelligence</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 bg-slate-800/50 rounded-full px-3 py-1.5 border border-indigo-700/50 backdrop-blur-sm">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search insights..."
                className="bg-transparent border-none focus:outline-none text-sm w-40 placeholder:text-slate-500 text-white"
              />
            </div>

            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-400 hover:text-slate-100">
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-600" />
              )}
            </Button>

            <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-slate-100">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-purple-500 rounded-full animate-pulse"></span>
            </Button>

            <Avatar>
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
              <AvatarFallback className="bg-slate-700 text-purple-500">JD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3 lg:col-span-2">
            <Card className="backdrop-blur-sm h-full bg-slate-900/50 border-indigo-700/50">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      activeTab === "overview"
                        ? "bg-indigo-500/20 text-purple-400 font-medium hover:bg-indigo-500/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    onClick={() => setActiveTab("overview")}
                  >
                    <Command className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      activeTab === "insights"
                        ? "bg-indigo-500/20 text-purple-400 font-medium hover:bg-indigo-500/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    onClick={() => setActiveTab("insights")}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    AI Insights
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      activeTab === "metrics"
                        ? "bg-indigo-500/20 text-purple-400 font-medium hover:bg-indigo-500/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    onClick={() => setActiveTab("metrics")}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Business Metrics
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      activeTab === "data"
                        ? "bg-indigo-500/20 text-purple-400 font-medium hover:bg-indigo-500/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    onClick={() => setActiveTab("data")}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Data Sources
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      activeTab === "actions"
                        ? "bg-indigo-500/20 text-purple-400 font-medium hover:bg-indigo-500/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    onClick={() => setActiveTab("actions")}
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Automated Actions
                  </Button>
                </nav>

                <div className="mt-8 pt-6 border-t border-indigo-700/50">
                  <div className="text-xs text-slate-500 mb-2 font-mono">SYSTEM STATUS</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-400">AI Processing</div>
                      <div className="text-sm font-mono">
                        {aiProcessing}% <span className="text-purple-400"></span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-400">Data Quality</div>
                      <div className="text-sm font-mono">
                        {dataQuality}% <span className="text-teal-400"></span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-400">Security</div>
                      <div className="text-sm font-mono">
                        {securityLevel}% <span className="text-blue-400"></span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-400">Cost Efficiency</div>
                      <div className="text-sm font-mono">
                        {costEfficiency}% <span className="text-indigo-400"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-12 md:col-span-9 lg:col-span-7">
            <Card className="backdrop-blur-sm overflow-hidden bg-slate-900/50 border-indigo-700/50">
              <CardHeader className="border-b border-indigo-700/50 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-100 flex items-center">
                    {activeTab === "overview" && (
                      <>
                        <Activity className="mr-2 h-5 w-5 text-purple-500" />
                        ANDI's Room
                      </>
                    )}
                    {activeTab === "insights" && (
                      <>
                        <Brain className="mr-2 h-5 w-5 text-purple-500" />
                        AI Insights
                      </>
                    )}
                    {activeTab === "metrics" && (
                      <>
                        <Activity className="mr-2 h-5 w-5 text-purple-500" />
                        Business Metrics
                      </>
                    )}
                    {activeTab === "data" && (
                      <>
                        <Database className="mr-2 h-5 w-5 text-purple-500" />
                        Data Sources
                      </>
                    )}
                    {activeTab === "actions" && (
                      <>
                        <Rocket className="mr-2 h-5 w-5 text-purple-500" />
                        Automated Actions
                      </>
                    )}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-slate-800/50 text-purple-400 border-purple-500/50 text-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mr-1 animate-pulse"></div>
                      LIVE
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {activeTab === "overview" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <Card className="overflow-hidden bg-slate-800/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                          <DollarSign className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{mockMetrics.revenue.value}</div>
                          <div className="text-sm text-muted-foreground">
                            <span
                              className={`text-xs ${mockMetrics.revenue.trend === "up" ? "text-green-500" : "text-red-500"}`}
                            >
                              {mockMetrics.revenue.trend === "up" ? "+" : "-"}
                              {mockMetrics.revenue.change}
                            </span>
                            <span className="ml-1 text-slate-400">vs Last Quarter</span>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="overflow-hidden bg-slate-800/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Customer Retention</CardTitle>
                          <Users className="h-4 w-4 text-teal-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{mockMetrics.retention.value}</div>
                          <div className="text-sm text-muted-foreground">
                            <span
                              className={`text-xs ${mockMetrics.retention.trend === "up" ? "text-green-500" : "text-red-500"}`}
                            >
                              {mockMetrics.retention.trend === "up" ? "+" : "-"}
                              {mockMetrics.retention.change}
                            </span>
                            <span className="ml-1 text-slate-400">vs Last Quarter</span>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="overflow-hidden bg-slate-800/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Operational Costs</CardTitle>
                          <TrendingDown className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{mockMetrics.costs.value}</div>
                          <div className="text-sm text-muted-foreground">
                            <span
                              className={`text-xs ${mockMetrics.costs.trend === "down" ? "text-green-500" : "text-red-500"}`}
                            >
                              {mockMetrics.costs.trend === "down" ? "-" : "+"}
                              {mockMetrics.costs.change}
                            </span>
                            <span className="ml-1 text-slate-400">vs Last Quarter</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Tabs defaultValue="performance" className="w-full">
                      <div className="flex items-center justify-between mb-4">
                        <TabsList className="bg-slate-800/50 p-1">
                          <TabsTrigger
                            value="performance"
                            className="data-[state=active]:bg-slate-700 data-[state=active]:text-purple-400"
                          >
                            Performance
                          </TabsTrigger>
                          <TabsTrigger
                            value="predictions"
                            className="data-[state=active]:bg-slate-700 data-[state=active]:text-purple-400"
                          >
                            AI Predictions
                          </TabsTrigger>
                          <TabsTrigger
                            value="actions"
                            className="data-[state=active]:bg-slate-700 data-[state=active]:text-purple-400"
                          >
                            Automated Actions
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="performance" className="mt-0">
                        <div className="h-64 w-full relative bg-slate-800/30 rounded-lg border border-indigo-700/50 overflow-hidden">
                          <div className="h-full w-full flex items-center justify-center">
                            <BarChart className="h-16 w-16 text-slate-600" />
                          </div>
                          <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-sm rounded-md px-3 py-2 border border-indigo-700/50">
                            <div className="text-xs text-slate-400">Revenue Growth</div>
                            <div className="text-lg font-mono text-purple-400">+12.4%</div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="predictions" className="mt-0">
                        <div className="bg-slate-800/30 rounded-lg border border-indigo-700/50 p-4">
                          <div className="mb-4">
                            <h3 className="text-sm font-medium text-slate-200 mb-2">AI-Powered Forecasts</h3>
                            <p className="text-xs text-slate-400 mb-4">
                              ANDI has analyzed your business data and market trends to generate these predictions with
                              92% confidence.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 rounded-md p-3 border border-indigo-700/50">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-slate-300">Revenue Forecast</div>
                                <Badge
                                  variant="outline"
                                  className="bg-purple-500/10 text-purple-400 border-purple-500/30"
                                >
                                  92% Confidence
                                </Badge>
                              </div>
                              <div className="text-2xl font-bold text-purple-400 mb-1">+18.2%</div>
                              <div className="text-xs text-slate-400">Next Quarter</div>
                              <div className="text-xs text-slate-500 mt-2">
                                Seasonal trends and new product launches will drive growth
                              </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-md p-3 border border-indigo-700/50">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-slate-300">Customer Acquisition</div>
                                <Badge
                                  variant="outline"
                                  className="bg-purple-500/10 text-purple-400 border-purple-500/30"
                                >
                                  88% Confidence
                                </Badge>
                              </div>
                              <div className="text-2xl font-bold text-purple-400 mb-1">+124</div>
                              <div className="text-xs text-slate-400">Next Month</div>
                              <div className="text-xs text-slate-500 mt-2">
                                Digital channel optimization will improve conversion rates
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="actions" className="mt-0">
                        <div className="bg-slate-800/30 rounded-lg border border-indigo-700/50 overflow-hidden">
                          <div className="p-4 border-b border-indigo-700/50">
                            <h3 className="text-sm font-medium text-slate-200">Automated Business Actions</h3>
                            <p className="text-xs text-slate-400 mt-1">
                              ANDI has identified and executed these actions to optimize your business performance.
                            </p>
                          </div>

                          <div className="divide-y divide-indigo-700/30">
                            {automatedActions.map((action) => (
                              <div key={action.id} className="p-4 hover:bg-slate-800/50">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center">
                                      <h4 className="text-sm font-medium text-slate-200">{action.title}</h4>
                                      <Badge
                                        className={`ml-2 ${
                                          action.status === "completed"
                                            ? "bg-green-500/20 text-green-400 border-green-500/50"
                                            : action.status === "in_progress"
                                              ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                                              : "bg-amber-500/20 text-amber-400 border-amber-500/50"
                                        }`}
                                      >
                                        {action.status === "completed"
                                          ? "Completed"
                                          : action.status === "in_progress"
                                            ? "In Progress"
                                            : "Pending Approval"}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">{action.description}</p>
                                    <div className="flex items-center mt-2">
                                      <span className="text-xs text-slate-500">{action.time}</span>
                                      <span className="mx-2 text-slate-600">•</span>
                                      <span className="text-xs text-teal-400">{action.impact}</span>
                                    </div>
                                  </div>
                                  {action.status === "pending_approval" && (
                                    <div className="flex space-x-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-400"
                                        onClick={() => handleApproveAction(action.id)}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400"
                                      >
                                        Decline
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </>
                )}

                {activeTab === "insights" && (
                  <div className="space-y-6">
                    <div className="bg-slate-800/30 rounded-lg border border-indigo-700/50 p-4">
                      <h3 className="text-sm font-medium text-slate-200 mb-3">AI-Generated Insights</h3>
                      <div className="space-y-4">
                        {mockInsights
                          .filter((i) => i.type === "opportunity")
                          .map((insight) => (
                            <div key={insight.id} className="flex items-start space-x-3">
                              <div className="mt-0.5 p-1 rounded-full bg-green-500/10 border-green-500/30">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-200">{insight.title}</div>
                                <div className="text-xs text-slate-400 mt-1">{insight.description}</div>
                                <div className="text-xs text-green-400 mt-1">{insight.impact}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg border border-indigo-700/50 p-4">
                      <h3 className="text-sm font-medium text-slate-200 mb-3">Anomaly Detection</h3>
                      <div className="space-y-3">
                        {mockInsights
                          .filter((i) => i.type === "anomaly")
                          .map((insight) => (
                            <div key={insight.id} className="flex items-start space-x-3">
                              <div className="mt-0.5 p-1 rounded-full bg-amber-500/10 border-amber-500/30">
                                <AlertCircle className="h-3 w-3 text-amber-500" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-200">{insight.title}</div>
                                <div className="text-xs text-slate-400 mt-1">{insight.description}</div>
                                <div className="text-xs text-amber-400 mt-1">{insight.impact}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "metrics" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="overflow-hidden bg-slate-800/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                          <TrendingUp className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">3.8%</div>
                          <div className="text-sm text-muted-foreground">
                            <span className="text-xs text-green-500">+0.6%</span>
                            <span className="ml-1 text-slate-400">vs Last Month</span>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="overflow-hidden bg-slate-800/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                          <DollarSign className="h-4 w-4 text-teal-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">$128</div>
                          <div className="text-sm text-muted-foreground">
                            <span className="text-xs text-green-500">+$12</span>
                            <span className="ml-1 text-slate-400">vs Last Month</span>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="overflow-hidden bg-slate-800/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Customer Acquisition</CardTitle>
                          <Users className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">$42</div>
                          <div className="text-sm text-muted-foreground">
                            <span className="text-xs text-green-500">-$8</span>
                            <span className="ml-1 text-slate-400">Cost per Customer</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg border border-indigo-700/50 p-4">
                      <h3 className="text-sm font-medium text-slate-200 mb-3">Performance Metrics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 rounded-md p-3 border border-indigo-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-slate-300">Customer Lifetime Value</div>
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                              Increasing
                            </Badge>
                          </div>
                          <div className="text-2xl font-bold text-purple-400 mb-1">$842</div>
                          <div className="text-xs text-green-400">+12% vs Last Year</div>
                        </div>

                        <div className="bg-slate-800/50 rounded-md p-3 border border-indigo-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-slate-300">Repeat Purchase Rate</div>
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                              Stable
                            </Badge>
                          </div>
                          <div className="text-2xl font-bold text-teal-400 mb-1">38.2%</div>
                          <div className="text-xs text-blue-400">+0.8% vs Last Year</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "data" && (
                  <div className="space-y-6">
                    <div className="bg-slate-800/30 rounded-lg border border-indigo-700/50 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-200">Connected Data Sources</h3>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          <Plus className="h-4 w-4 mr-1" /> Add Source
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {mockDataSources.map((source) => (
                          <div
                            key={source.id}
                            className="flex items-center justify-between p-3 rounded-md bg-slate-800/50 border border-indigo-700/50"
                          >
                            <div>
                              <div className="text-sm font-medium text-white">{source.name}</div>
                              <div className="text-xs text-slate-400">
                                Status: <span className="text-green-400">{source.status}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-slate-500">Last Sync: {source.lastSync}</div>
                              <div className="text-xs text-slate-500">{source.dataPoints}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg border border-indigo-700/50 p-4">
                      <h3 className="text-sm font-medium text-slate-200 mb-3">Data Quality Metrics</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm text-slate-400">Completeness</div>
                            <div className="text-xs text-purple-400">96% complete</div>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                              style={{ width: "96%" }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm text-slate-400">Accuracy</div>
                            <div className="text-xs text-teal-400">98% accurate</div>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-teal-500 to-green-500 rounded-full"
                              style={{ width: "98%" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "actions" && (
                  <div className="space-y-6">
                    <div className="bg-slate-800/30 rounded-lg border border-indigo-700/50 overflow-hidden">
                      <div className="p-4 border-b border-indigo-700/50">
                        <h3 className="text-sm font-medium text-slate-200">Automated Business Actions</h3>
                        <p className="text-xs text-slate-400 mt-1">
                          ANDI has identified and executed these actions to optimize your business performance.
                        </p>
                      </div>

                      <div className="divide-y divide-indigo-700/30">
                        {automatedActions.map((action) => (
                          <div key={action.id} className="p-4 hover:bg-slate-800/50">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center">
                                  <h4 className="text-sm font-medium text-slate-200">{action.title}</h4>
                                  <Badge
                                    className={`ml-2 ${
                                      action.status === "completed"
                                        ? "bg-green-500/20 text-green-400 border-green-500/50"
                                        : action.status === "in_progress"
                                          ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                                          : "bg-amber-500/20 text-amber-400 border-amber-500/50"
                                    }`}
                                  >
                                    {action.status === "completed"
                                      ? "Completed"
                                      : action.status === "in_progress"
                                        ? "In Progress"
                                        : "Pending Approval"}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{action.description}</p>
                                <div className="flex items-center mt-2">
                                  <span className="text-xs text-slate-500">{action.time}</span>
                                  <span className="mx-2 text-slate-600">•</span>
                                  <span className="text-xs text-teal-400">{action.impact}</span>
                                </div>
                              </div>
                              {action.status === "pending_approval" && (
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-400"
                                    onClick={() => handleApproveAction(action.id)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400"
                                  >
                                    Decline
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Panel */}
          <div className="col-span-12 md:col-span-3">
            <Card className="backdrop-blur-sm h-full bg-slate-900/50 border-indigo-700/50">
              <CardHeader className="border-b border-indigo-700/50 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-100 flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5 text-purple-500" />
                    ANDI Chat
                  </CardTitle>
                  <Badge variant="outline" className="bg-slate-800/50 text-purple-400 border-purple-500/50 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mr-1 animate-pulse"></div>
                    ONLINE
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[calc(100%-60px)]">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === "user" ? "bg-purple-500/20 text-white" : "bg-slate-800/50 text-slate-200"
                          }`}
                        >
                          <div className="whitespace-pre-line text-sm">{message.content}</div>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-lg p-3 bg-slate-800/50 text-slate-200">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce"></div>
                            <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce delay-100"></div>
                            <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce delay-200"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-indigo-700/50">
                  <form onSubmit={handleChatSubmit} className="flex space-x-2">
                    <Input
                      placeholder="Ask ANDI anything..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="bg-slate-800/50 border-indigo-700/50 text-white"
                    />
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                      Send
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Version 2: Minimal Insights Dashboard
  const MinimalInsightsDashboard = () => {
    const [showInsights, setShowInsights] = useState(false)
    const [selectedMetric, setSelectedMetric] = useState(null)
    const [timeRange, setTimeRange] = useState("24h")

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-900">
        <div className="flex h-screen">
          {/* Main Content */}
          <div className="flex-1 p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <Brain className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold text-white">ANDI</span>
                <span className="text-xs text-slate-400 hidden md:inline-block">Adaptive Neural Data Intelligence</span>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="text-slate-400 hover:text-slate-100"
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5 text-amber-400" />
                  ) : (
                    <Moon className="h-5 w-5 text-indigo-600" />
                  )}
                </Button>

                <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-slate-100">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
                </Button>

                <Avatar>
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
                  <AvatarFallback className="bg-slate-700 text-blue-500">JD</AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-4 mb-8">
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search insights..."
                  className="pl-10 bg-white/5 border-slate-800 text-slate-300 placeholder:text-slate-500"
                />
              </div>
              <Button variant="outline" className="border-slate-800">
                <Plus className="h-4 w-4 mr-2" /> New Query
              </Button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <Card
                className={`p-4 bg-white/5 border-slate-800 cursor-pointer transition-all hover:bg-white/10 ${
                  selectedMetric === "performance" ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => setSelectedMetric("performance")}
              >
                <div className="flex items-center justify-between mb-4">
                  <Activity className="h-5 w-5 text-blue-400" />
                  <span className="text-xs text-slate-400">{timeRange}</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">{mockMetrics.performance.value}</div>
                <div className="text-sm text-slate-400">System Performance</div>
              </Card>

              <Card
                className={`p-4 bg-white/5 border-slate-800 cursor-pointer transition-all hover:bg-white/10 ${
                  selectedMetric === "users" ? "ring-2 ring-green-500" : ""
                }`}
                onClick={() => setSelectedMetric("users")}
              >
                <div className="flex items-center justify-between mb-4">
                  <Users className="h-5 w-5 text-green-400" />
                  <span className="text-xs text-slate-400">{timeRange}</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">{mockMetrics.activeUsers.value}</div>
                <div className="text-sm text-slate-400">Active Users</div>
              </Card>

              <Card
                className={`p-4 bg-white/5 border-slate-800 cursor-pointer transition-all hover:bg-white/10 ${
                  selectedMetric === "processing" ? "ring-2 ring-purple-500" : ""
                }`}
                onClick={() => setSelectedMetric("processing")}
              >
                <div className="flex items-center justify-between mb-4">
                  <Brain className="h-5 w-5 text-purple-400" />
                  <span className="text-xs text-slate-400">{timeRange}</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">{mockMetrics.aiOperations.value}</div>
                <div className="text-sm text-slate-400">AI Operations</div>
              </Card>

              <Card
                className={`p-4 bg-white/5 border-slate-800 cursor-pointer transition-all hover:bg-white/10 ${
                  selectedMetric === "security" ? "ring-2 ring-red-500" : ""
                }`}
                onClick={() => setSelectedMetric("security")}
              >
                <div className="flex items-center justify-between mb-4">
                  <Shield className="h-5 w-5 text-red-400" />
                  <span className="text-xs text-slate-400">{timeRange}</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">{mockMetrics.securityIncidents.value}</div>
                <div className="text-sm text-slate-400">Security Incidents</div>
              </Card>
            </div>

            {/* Main Chart Area */}
            <Card className="p-6 bg-white/5 border-slate-800 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">System Overview</h2>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-slate-800 ${timeRange === "24h" ? "bg-slate-700" : ""}`}
                    onClick={() => setTimeRange("24h")}
                  >
                    <Clock className="h-4 w-4 mr-2" /> Last 24h
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-slate-800 ${timeRange === "7d" ? "bg-slate-700" : ""}`}
                    onClick={() => setTimeRange("7d")}
                  >
                    <Clock className="h-4 w-4 mr-2" /> Last 7d
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-slate-800 ${timeRange === "30d" ? "bg-slate-700" : ""}`}
                    onClick={() => setTimeRange("30d")}
                  >
                    <Clock className="h-4 w-4 mr-2" /> Last 30d
                  </Button>
                </div>
              </div>
              <div className="h-64 flex items-center justify-center">
                <LineChart className="h-16 w-16 text-slate-600" />
              </div>
            </Card>

            {/* Status Grid */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-white/5 border-slate-800">
                <div className="flex items-center space-x-2 mb-4">
                  <CpuIcon className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-medium text-white">Processing</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">CPU Load</span>
                    <span className="text-xs text-blue-400">{aiProcessing}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Memory Usage</span>
                    <span className="text-xs text-blue-400">67%</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-white/5 border-slate-800">
                <div className="flex items-center space-x-2 mb-4">
                  <Cloud className="h-5 w-5 text-purple-400" />
                  <span className="text-sm font-medium text-white">Services</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">API Status</span>
                    <span className="text-xs text-green-400">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Response Time</span>
                    <span className="text-xs text-purple-400">{mockMetrics.responseTime.value}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-white/5 border-slate-800">
                <div className="flex items-center space-x-2 mb-4">
                  <Database className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium text-white">Storage</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Used Space</span>
                    <span className="text-xs text-green-400">42%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">I/O Operations</span>
                    <span className="text-xs text-green-400">1.2K/s</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Insights Drawer */}
          <AnimatePresence>
            {showInsights && (
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-96 bg-slate-900 border-l border-slate-800"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">Live Insights</h2>
                    <Button variant="ghost" size="sm" onClick={() => setShowInsights(false)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <ScrollArea className="h-[calc(100vh-8rem)]">
                    <div className="space-y-4 pr-4">
                      {mockInsights.map((insight) => (
                        <Card key={insight.id} className="p-4 bg-white/5 border-slate-800">
                          <div className="flex items-start space-x-3">
                            {insight.type === "anomaly" ? (
                              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
                            ) : (
                              <TrendingUp className="h-5 w-5 text-green-400 mt-0.5" />
                            )}
                            <div>
                              <h3 className="text-sm font-medium text-white mb-1">{insight.title}</h3>
                              <p className="text-xs text-slate-400">{insight.description}</p>
                              <p className="text-xs text-amber-400 mt-1">{insight.time}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Insights Button */}
          <Button
            variant="outline"
            size="sm"
            className="fixed right-8 top-1/2 -translate-y-1/2 border-slate-800"
            onClick={() => setShowInsights(!showInsights)}
          >
            {showInsights ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    )
  }

  // Version 3: Command Center Dashboard
  const CommandCenterDashboard = () => {
    const [selectedCommand, setSelectedCommand] = useState(null)
    const [showCommandMenu, setShowCommandMenu] = useState(false)

    const commands = [
      { id: "ai", icon: Brain, label: "AI Control", color: "purple" },
      { id: "security", icon: Shield, label: "Security", color: "red" },
      { id: "network", icon: Globe, label: "Network", color: "blue" },
      { id: "system", icon: Terminal, label: "System", color: "green" },
      { id: "data", icon: Database, label: "Data", color: "amber" },
      { id: "comms", icon: MessageSquare, label: "Communications", color: "pink" },
      { id: "power", icon: Zap, label: "Power", color: "yellow" },
      { id: "settings", icon: Settings, label: "Settings", color: "slate" },
    ]

    const getCommandContent = (commandId) => {
      switch (commandId) {
        case "ai":
          return (
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-purple-500/10 border-purple-500/30 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Activity className="h-5 w-5 text-purple-400" />
                  <span className="text-sm font-medium text-purple-100">AI Status</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">98.2%</div>
                <div className="text-sm text-purple-200">Operational</div>
              </Card>

              <Card className="bg-blue-500/10 border-blue-500/30 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <CpuIcon className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-medium text-blue-100">Processing</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">1.2M</div>
                <div className="text-sm text-blue-200">Operations/sec</div>
              </Card>

              <Card className="bg-green-500/10 border-green-500/30 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Brain className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium text-green-100">Model Status</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">Active</div>
                <div className="text-sm text-green-200">GPT-4 Turbo</div>
              </Card>

              <Card className="bg-amber-500/10 border-amber-500/30 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Rocket className="h-5 w-5 text-amber-400" />
                  <span className="text-sm font-medium text-amber-100">Performance</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">42ms</div>
                <div className="text-sm text-amber-200">Avg. response time</div>
              </Card>
            </div>
          )
        case "security":
          return (
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-red-500/10 border-red-500/30 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Shield className="h-5 w-5 text-red-400" />
                  <span className="text-sm font-medium text-red-100">Security Status</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">Protected</div>
                <div className="text-sm text-red-200">No threats detected</div>
              </Card>

              <Card className="bg-blue-500/10 border-blue-500/30 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Lock className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-medium text-blue-100">Encryption</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">Active</div>
                <div className="text-sm text-blue-200">AES-256</div>
              </Card>

              <Card className="bg-green-500/10 border-green-500/30 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium text-green-100">Access Control</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">Enforced</div>
                <div className="text-sm text-green-200">Role-based</div>
              </Card>

              <Card className="bg-amber-500/10 border-amber-500/30 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                  <span className="text-sm font-medium text-amber-100">Incidents</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">0</div>
                <div className="text-sm text-amber-200">Last 30 days</div>
              </Card>
            </div>
          )
        case "data":
          return (
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-amber-500/10 border-amber-500/30 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Database className="h-5 w-5 text-amber-400" />
                  <span className="text-sm font-medium text-amber-100">Storage</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">42%</div>
                <div className="text-sm text-amber-200">Used capacity</div>
              </Card>

              <Card className="bg-blue-500/10 border-blue-500/30 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Activity className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-medium text-blue-100">I/O Operations</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">1.2K/s</div>
                <div className="text-sm text-blue-200">Current rate</div>
              </Card>

              <Card className="bg-green-500/10 border-green-500/30 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <PieChart className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium text-green-100">Data Quality</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">{dataQuality}%</div>
                <div className="text-sm text-green-200">Accuracy score</div>
              </Card>

              <Card className="bg-purple-500/10 border-purple-500/30 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <RefreshCw className="h-5 w-5 text-purple-400" />
                  <span className="text-sm font-medium text-purple-100">Last Sync</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">2m ago</div>
                <div className="text-sm text-purple-200">All sources</div>
              </Card>
            </div>
          )
        default:
          return (
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-purple-500/10 border-purple-500/30 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Activity className="h-5 w-5 text-purple-400" />
                  <span className="text-sm font-medium text-purple-100">Status</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">98.2%</div>
                <div className="text-sm text-purple-200">Operational</div>
              </Card>

              <Card className="bg-blue-500/10 border-blue-500/30 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <CpuIcon className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-medium text-blue-100">Processing</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">1.2M</div>
                <div className="text-sm text-blue-200">Operations/sec</div>
              </Card>

              <Card className="bg-green-500/10 border-green-500/30 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Lock className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium text-green-100">Security</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">Active</div>
                <div className="text-sm text-green-200">No threats detected</div>
              </Card>

              <Card className="bg-amber-500/10 border-amber-500/30 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Rocket className="h-5 w-5 text-amber-400" />
                  <span className="text-sm font-medium text-amber-100">Performance</span>
                </div>
                <div className="text-2xl font-semibold text-white mb-1">42ms</div>
                <div className="text-sm text-amber-200">Avg. response time</div>
              </Card>
            </div>
          )
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-900 relative overflow-hidden">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-purple-400" />
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 via-teal-400 to-blue-500 bg-clip-text text-transparent">
              ANDI
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-400 hover:text-slate-100">
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-600" />
              )}
            </Button>

            <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-slate-100">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-purple-500 rounded-full animate-pulse"></span>
            </Button>

            <Avatar>
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
              <AvatarFallback className="bg-slate-700 text-purple-500">JD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Central Command Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            className="relative z-10 h-32 w-32 rounded-full bg-slate-900 border-4 border-purple-500/30 flex items-center justify-center group"
            onClick={() => setShowCommandMenu(!showCommandMenu)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Command className="h-12 w-12 text-purple-400 group-hover:text-purple-300 transition-colors" />
            <div className="absolute inset-0 rounded-full bg-purple-500/10 animate-pulse" />
          </motion.button>
        </div>

        {/* Radial Command Menu */}
        <AnimatePresence>
          {showCommandMenu && (
            <div className="absolute inset-0 flex items-center justify-center">
              {commands.map((command, index) => {
                const angle = (index * 360) / commands.length
                const radius = 200
                const x = Math.cos((angle * Math.PI) / 180) * radius
                const y = Math.sin((angle * Math.PI) / 180) * radius

                return (
                  <motion.div
                    key={command.id}
                    className="absolute"
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{
                      scale: 1,
                      x,
                      y,
                    }}
                    exit={{ scale: 0, x: 0, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      delay: index * 0.05,
                    }}
                  >
                    <Button
                      className={`h-16 w-16 rounded-full bg-${command.color}-500/20 border-2 border-${command.color}-500/30 p-0 hover:bg-${command.color}-500/30`}
                      onClick={() => {
                        setSelectedCommand(command.id)
                        setShowCommandMenu(false)
                      }}
                    >
                      <command.icon className={`h-6 w-6 text-${command.color}-400`} />
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Command Content */}
        <AnimatePresence>
          {selectedCommand && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-x-0 bottom-0 p-8"
            >
              <Card className="bg-black/50 border-purple-500/20 backdrop-blur-sm">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      {commands.find((c) => c.id === selectedCommand)?.icon && (\
                        <commands.find((c) => c.id === selectedCommand).icon className="h-6 w-6 text-purple-400" />
                      )}
                      <h2 className="text-xl font-semibold text-white">
                        {commands.find((c) => c.id === selectedCommand)?.label} Control
                      </h2>
                    </div>
                    <Button
                      variant="outline"
                      className="border-purple-500/30"
                      onClick={() => setSelectedCommand(null)}
                    >
                      <CircleOff className="h-4 w-4 mr-2" /> Close
                    </Button>
                  </div>

                  {getCommandContent(selectedCommand)}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Indicators */}
        <div className="absolute bottom-4 left-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-green-400">System Online</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-xs text-blue-400">Data Synced</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></div>
            <span className="text-xs text-purple-400">AI Active</span>
          </div>
        </div>

        {/* Time Display */}
        <div className="absolute top-4 right-4 text-xs text-slate-400 font-mono">
          {formatTime(currentTime)} | {formatDate(currentTime)}
        </div>
      </div>
    )
  }

  return (
    <div className={theme}>
      <VersionSelector />
      {version === "v1" && <GlassPanelsDashboard />}
      {version === "v2" && <MinimalInsightsDashboard />}
      {version === "v3" && <CommandCenterDashboard />}
    </div>
  )
}

