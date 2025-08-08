"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Activity,
  BarChart,
  Brain,
  Clock,
  DollarSign,
  Globe,
  LineChart,
  PieChart,
  Plus,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"

interface WidgetTemplate {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  category: "analytics" | "business" | "security" | "market" | "ai"
  dataSource: string
  size: "small" | "medium" | "large"
}

export function WidgetsSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [addWidgetOpen, setAddWidgetOpen] = useState(false)
  const [selectedWidget, setSelectedWidget] = useState<WidgetTemplate | null>(null)

  // Sample widget templates
  const widgetTemplates: WidgetTemplate[] = [
    {
      id: "revenue-metrics",
      title: "Revenue Metrics",
      description: "Track revenue performance over time with key indicators",
      icon: <DollarSign className="h-8 w-8 text-green-500" />,
      category: "business",
      dataSource: "Financial System",
      size: "medium",
    },
    {
      id: "customer-retention",
      title: "Customer Retention",
      description: "Monitor customer retention rates and churn indicators",
      icon: <Users className="h-8 w-8 text-blue-500" />,
      category: "business",
      dataSource: "CRM System",
      size: "medium",
    },
    {
      id: "market-share",
      title: "Market Share Analysis",
      description: "Track your position in the market compared to competitors",
      icon: <PieChart className="h-8 w-8 text-purple-500" />,
      category: "market",
      dataSource: "Market Intelligence API",
      size: "medium",
    },
    {
      id: "security-status",
      title: "Security Status",
      description: "Monitor security metrics and potential vulnerabilities",
      icon: <ShieldCheck className="h-8 w-8 text-red-500" />,
      category: "security",
      dataSource: "Security System",
      size: "small",
    },
    {
      id: "ai-insights",
      title: "AI Insights",
      description: "Get AI-generated insights based on your business data",
      icon: <Brain className="h-8 w-8 text-indigo-500" />,
      category: "ai",
      dataSource: "ANDI Core",
      size: "large",
    },
    {
      id: "performance-metrics",
      title: "Performance Metrics",
      description: "Track key performance indicators for your business",
      icon: <Activity className="h-8 w-8 text-teal-500" />,
      category: "analytics",
      dataSource: "Analytics Platform",
      size: "medium",
    },
    {
      id: "sales-forecast",
      title: "Sales Forecast",
      description: "AI-powered sales predictions for upcoming periods",
      icon: <TrendingUp className="h-8 w-8 text-amber-500" />,
      category: "ai",
      dataSource: "ANDI Core + CRM",
      size: "medium",
    },
    {
      id: "competitor-activity",
      title: "Competitor Activity",
      description: "Monitor competitor actions and market movements",
      icon: <Globe className="h-8 w-8 text-blue-500" />,
      category: "market",
      dataSource: "Market Intelligence API",
      size: "medium",
    },
    {
      id: "real-time-metrics",
      title: "Real-Time Metrics",
      description: "Live data on key business metrics updated in real-time",
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      category: "analytics",
      dataSource: "Analytics Platform",
      size: "small",
    },
    {
      id: "historical-trends",
      title: "Historical Trends",
      description: "Long-term trend analysis of key business metrics",
      icon: <LineChart className="h-8 w-8 text-indigo-500" />,
      category: "analytics",
      dataSource: "Data Warehouse",
      size: "large",
    },
    {
      id: "conversion-rates",
      title: "Conversion Rates",
      description: "Track conversion metrics across your sales funnel",
      icon: <BarChart className="h-8 w-8 text-green-500" />,
      category: "business",
      dataSource: "CRM + Analytics",
      size: "medium",
    },
    {
      id: "uptime-monitor",
      title: "System Uptime",
      description: "Monitor system availability and performance",
      icon: <Clock className="h-8 w-8 text-blue-500" />,
      category: "security",
      dataSource: "Monitoring System",
      size: "small",
    },
  ]

  // Filter widgets based on search and category
  const filteredWidgets = widgetTemplates.filter((widget) => {
    const matchesSearch =
      widget.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory ? widget.category === selectedCategory : true
    return matchesSearch && matchesCategory
  })

  // Categories for filtering
  const categories = [
    { id: "analytics", label: "Analytics", color: "bg-blue-500" },
    { id: "business", label: "Business", color: "bg-green-500" },
    { id: "security", label: "Security", color: "bg-red-500" },
    { id: "market", label: "Market", color: "bg-purple-500" },
    { id: "ai", label: "AI", color: "bg-indigo-500" },
  ]

  const handleAddWidget = () => {
    // Logic to add the selected widget to the dashboard
    console.log("Adding widget:", selectedWidget)
    setAddWidgetOpen(false)
    setSelectedWidget(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Widget Management</h1>
          <p className="text-muted-foreground">Customize your dashboard with widgets</p>
        </div>
        <Button onClick={() => setAddWidgetOpen(true)} className="bg-zamora-purple hover:bg-zamora-purple-dark">
          <Plus className="mr-2 h-4 w-4" /> Add Widget
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Active Widgets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            These widgets are currently displayed on your dashboard. You can customize, resize, or remove them.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/50 flex flex-col items-center justify-center p-6 h-[200px] cursor-pointer hover:border-zamora-purple/50 transition-colors">
              <Plus className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-center">Add a new widget to your dashboard</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setAddWidgetOpen(true)}>
                Browse Widgets
              </Button>
            </Card>

            {/* Sample active widgets would be displayed here */}
            <Card className="relative">
              <div className="absolute top-2 right-2 flex space-x-1">
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Active</Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-xs text-muted-foreground">Financial System</p>
                    <p className="text-xs text-muted-foreground mt-1">Medium Size</p>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm" className="text-xs">
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="relative">
              <div className="absolute top-2 right-2 flex space-x-1">
                <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Active</Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Customer Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-xs text-muted-foreground">CRM System</p>
                    <p className="text-xs text-muted-foreground mt-1">Medium Size</p>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm" className="text-xs">
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Widgets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search widgets..."
                className="w-full h-9 rounded-md border border-input pl-8 pr-4 py-2 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={selectedCategory === null ? "bg-zamora-purple hover:bg-zamora-purple-dark" : ""}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id ? "bg-zamora-purple hover:bg-zamora-purple-dark" : ""}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWidgets.map((widget) => (
              <Card
                key={widget.id}
                className="cursor-pointer hover:border-zamora-purple/50 transition-colors"
                onClick={() => {
                  setSelectedWidget(widget)
                  setAddWidgetOpen(true)
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{widget.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">{widget.icon}</div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">{widget.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {widget.dataSource}
                        </Badge>
                        <Badge
                          className={`text-xs ${
                            widget.category === "analytics"
                              ? "bg-blue-500/20 text-blue-500 border-blue-500/30"
                              : widget.category === "business"
                                ? "bg-green-500/20 text-green-500 border-green-500/30"
                                : widget.category === "security"
                                  ? "bg-red-500/20 text-red-500 border-red-500/30"
                                  : widget.category === "market"
                                    ? "bg-purple-500/20 text-purple-500 border-purple-500/30"
                                    : "bg-indigo-500/20 text-indigo-500 border-indigo-500/30"
                          }`}
                        >
                          {widget.category.charAt(0).toUpperCase() + widget.category.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {widget.size.charAt(0).toUpperCase() + widget.size.slice(1)} Size
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Widget Dialog */}
      <Dialog open={addWidgetOpen} onOpenChange={setAddWidgetOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Widget to Dashboard</DialogTitle>
            <DialogDescription>
              {selectedWidget
                ? `Configure the "${selectedWidget.title}" widget before adding it to your dashboard.`
                : "Select a widget to add to your dashboard."}
            </DialogDescription>
          </DialogHeader>

          {selectedWidget && (
            <div className="grid gap-4 py-4">
              <div className="flex items-start gap-4 p-4 bg-secondary/50 rounded-lg">
                <div className="mt-1">{selectedWidget.icon}</div>
                <div>
                  <h3 className="font-medium">{selectedWidget.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{selectedWidget.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedWidget.dataSource}
                    </Badge>
                    <Badge
                      className={`text-xs ${
                        selectedWidget.category === "analytics"
                          ? "bg-blue-500/20 text-blue-500 border-blue-500/30"
                          : selectedWidget.category === "business"
                            ? "bg-green-500/20 text-green-500 border-green-500/30"
                            : selectedWidget.category === "security"
                              ? "bg-red-500/20 text-red-500 border-red-500/30"
                              : selectedWidget.category === "market"
                                ? "bg-purple-500/20 text-purple-500 border-purple-500/30"
                                : "bg-indigo-500/20 text-indigo-500 border-indigo-500/30"
                      }`}
                    >
                      {selectedWidget.category.charAt(0).toUpperCase() + selectedWidget.category.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="widget-location" className="text-right text-sm font-medium">
                  Dashboard Location
                </label>
                <select
                  id="widget-location"
                  defaultValue="top"
                  className="col-span-3 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="top">Top Section</option>
                  <option value="middle">Middle Section</option>
                  <option value="bottom">Bottom Section</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="widget-size" className="text-right text-sm font-medium">
                  Widget Size
                </label>
                <select
                  id="widget-size"
                  defaultValue={selectedWidget.size}
                  className="col-span-3 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="widget-refresh" className="text-right text-sm font-medium">
                  Refresh Rate
                </label>
                <select
                  id="widget-refresh"
                  defaultValue="5"
                  className="col-span-3 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="1">1 minute</option>
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddWidgetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWidget} disabled={!selectedWidget}>
              Add Widget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

