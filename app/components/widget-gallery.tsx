"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity,
  BarChart4,
  Brain,
  Building2,
  Clock,
  CreditCard,
  Database,
  DollarSign,
  Globe,
  LineChart,
  PieChart,
  ShieldCheck,
  Users,
} from "lucide-react"

export type WidgetType = {
  id: string
  title: string
  category: string
  description: string
  icon: React.ElementType
  size: "small" | "medium" | "large"
}

const availableWidgets: WidgetType[] = [
  {
    id: "revenue-chart",
    title: "Revenue Chart",
    category: "business",
    description: "Track revenue performance over time",
    icon: DollarSign,
    size: "medium",
  },
  {
    id: "customer-acquisition",
    title: "Customer Acquisition",
    category: "business",
    description: "Monitor new customer sign-ups",
    icon: Users,
    size: "medium",
  },
  {
    id: "market-trends",
    title: "Market Trends",
    category: "market",
    description: "Analyze industry market trends",
    icon: Globe,
    size: "medium",
  },
  {
    id: "competitor-analysis",
    title: "Competitor Analysis",
    category: "market",
    description: "Track competitor performance",
    icon: Building2,
    size: "medium",
  },
  {
    id: "ai-predictions",
    title: "AI Predictions",
    category: "ai",
    description: "View AI-generated business forecasts",
    icon: Brain,
    size: "medium",
  },
  {
    id: "anomaly-detection",
    title: "Anomaly Detection",
    category: "ai",
    description: "Identify unusual patterns in your data",
    icon: Activity,
    size: "medium",
  },
  {
    id: "data-connections",
    title: "Data Connections",
    category: "data",
    description: "Manage your data source connections",
    icon: Database,
    size: "medium",
  },
  {
    id: "security-status",
    title: "Security Status",
    category: "security",
    description: "Monitor your security posture",
    icon: ShieldCheck,
    size: "medium",
  },
  {
    id: "performance-metrics",
    title: "Performance Metrics",
    category: "business",
    description: "Key performance indicators",
    icon: BarChart4,
    size: "medium",
  },
  {
    id: "expense-tracker",
    title: "Expense Tracker",
    category: "business",
    description: "Track company expenses",
    icon: CreditCard,
    size: "medium",
  },
  {
    id: "uptime-monitor",
    title: "Uptime Monitor",
    category: "data",
    description: "Monitor system availability",
    icon: Clock,
    size: "medium",
  },
  {
    id: "sales-pipeline",
    title: "Sales Pipeline",
    category: "business",
    description: "Track sales opportunities",
    icon: PieChart,
    size: "medium",
  },
  {
    id: "growth-trends",
    title: "Growth Trends",
    category: "business",
    description: "Analyze business growth patterns",
    icon: LineChart,
    size: "medium",
  },
]

interface WidgetGalleryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddWidget: (widget: WidgetType) => void
}

export function WidgetGallery({ open, onOpenChange, onAddWidget }: WidgetGalleryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const filteredWidgets = availableWidgets.filter((widget) => {
    const matchesSearch =
      widget.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeTab === "all" || widget.category === activeTab
    return matchesSearch && matchesCategory
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Widget Gallery</DialogTitle>
          <DialogDescription>Browse and add widgets to your dashboard</DialogDescription>
        </DialogHeader>

        <div className="my-4">
          <Input
            placeholder="Search widgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start mb-4 overflow-x-auto">
              <TabsTrigger value="all">All Widgets</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="market">Market</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWidgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="border rounded-lg p-4 hover:border-purple-400 cursor-pointer transition-all"
                    onClick={() => onAddWidget(widget)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-md">
                        <widget.icon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{widget.title}</h3>
                        <p className="text-sm text-muted-foreground">{widget.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredWidgets.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No widgets found matching your criteria</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

