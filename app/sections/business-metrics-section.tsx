"use client"

import { Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart } from "../components/line-chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
// Add the WidgetMenu import at the top of the file
import { WidgetMenu } from "../components/widget-menu"
import { SmallWidget } from "../components/small-widget"

// Update the BusinessMetricsSectionProps interface to include the widget management props
interface BusinessMetricsSectionProps {
  highlightItem?: string | null
  subsidiary?: {
    id: string
    name: string
    region: string
    employees: number
    revenue: string
    color: string
  }
  widgetSizes?: Record<string, "small" | "medium" | "large">
  onRemoveWidget?: (id: string) => void
  onCustomizeWidget?: (id: string) => void
  onResizeWidget?: (id: string, size: "small" | "medium" | "large") => void
  onRearrange?: () => void
  rearrangeMode?: boolean
}

// Update the component parameters to include the new props
export function BusinessMetricsSection({
  highlightItem,
  subsidiary,
  widgetSizes = {},
  onRemoveWidget = () => {},
  onCustomizeWidget = () => {},
  onResizeWidget = () => {},
  onRearrange = () => {},
  rearrangeMode = false,
}: BusinessMetricsSectionProps) {
  const [revenueTimePeriod, setRevenueTimePeriod] = useState<"month" | "quarter">("month")

  // Add state to track widget sizes
  // Add this inside the BusinessMetricsSection component
  const [widgetSizesLocal, setWidgetSizesLocal] = useState({
    revenue: "medium" as "small" | "medium" | "large",
    customers: "medium" as "small" | "medium" | "large",
    retention: "medium" as "small" | "medium" | "large",
    growth: "medium" as "small" | "medium" | "large",
  })

  const [visibleWidgets, setVisibleWidgets] = useState({
    revenue: true,
    customers: true,
    retention: true,
    growth: true,
  })

  const handleRemoveWidget = (widgetId: keyof typeof visibleWidgets) => {
    setVisibleWidgets({
      ...visibleWidgets,
      [widgetId]: false,
    })
  }

  const handleResizeWidget = (widgetId: keyof typeof widgetSizesLocal, size: "small" | "medium" | "large") => {
    setWidgetSizesLocal({
      ...widgetSizesLocal,
      [widgetId]: size,
    })
  }

  // Subsidiary-specific data
  const getSubsidiaryData = () => {
    // Default data (global company)
    let data = {
      revenue: "$1.24M",
      conversionRate: "3.8%",
      conversionChange: "+0.6%",
      avgOrderValue: "$128",
      avgOrderChange: "+$12",
      customerAcquisition: "$42",
      customerAcquisitionChange: "-$8",
      monthlyData: [
        { month: "JUL", value: 80 },
        { month: "AUG", value: 100 },
        { month: "SEP", value: 70 },
        { month: "OCT", value: 80 },
        { month: "NOV", value: 120 },
        { month: "DEC", value: 80 },
      ],
      quarterlyData: [
        { month: "Q1", value: 220 },
        { month: "Q2", value: 180 },
        { month: "Q3", value: 250 },
        { month: "Q4", value: 280 },
      ],
      prevYearMonthlyData: [
        { month: "JUL", value: 65 },
        { month: "AUG", value: 85 },
        { month: "SEP", value: 60 },
        { month: "OCT", value: 70 },
        { month: "NOV", value: 95 },
        { month: "DEC", value: 70 },
      ],
      prevYearQuarterlyData: [
        { month: "Q1", value: 190 },
        { month: "Q2", value: 160 },
        { month: "Q3", value: 210 },
        { month: "Q4", value: 235 },
      ],
      chartColor: "#c44ed9", // purple
      ltv: "$842",
      ltvChange: "+12%",
      repeatRate: "38.2%",
      repeatRateChange: "+0.8%",
    }

    // Subsidiary-specific data
    if (subsidiary) {
      switch (subsidiary.id) {
        case "us":
          data = {
            ...data,
            revenue: "$580K",
            conversionRate: "4.2%",
            conversionChange: "+0.8%",
            avgOrderValue: "$215",
            avgOrderChange: "+$18",
            customerAcquisition: "$38",
            customerAcquisitionChange: "-$12",
            monthlyData: [
              { month: "JUL", value: 40 },
              { month: "AUG", value: 45 },
              { month: "SEP", value: 42 },
              { month: "OCT", value: 48 },
              { month: "NOV", value: 55 },
              { month: "DEC", value: 60 },
            ],
            quarterlyData: [
              { month: "Q1", value: 120 },
              { month: "Q2", value: 135 },
              { month: "Q3", value: 145 },
              { month: "Q4", value: 180 },
            ],
            prevYearMonthlyData: [
              { month: "JUL", value: 32 },
              { month: "AUG", value: 38 },
              { month: "SEP", value: 35 },
              { month: "OCT", value: 40 },
              { month: "NOV", value: 45 },
              { month: "DEC", value: 48 },
            ],
            prevYearQuarterlyData: [
              { month: "Q1", value: 100 },
              { month: "Q2", value: 110 },
              { month: "Q3", value: 120 },
              { month: "Q4", value: 140 },
            ],
            chartColor: "#3b82f6", // blue
            ltv: "$1,250",
            ltvChange: "+18%",
            repeatRate: "42.5%",
            repeatRateChange: "+2.2%",
          }
          break
        case "uk":
          data = {
            ...data,
            revenue: "$420K",
            conversionRate: "2.8%",
            conversionChange: "+0.3%",
            avgOrderValue: "$320",
            avgOrderChange: "+$25",
            customerAcquisition: "$65",
            customerAcquisitionChange: "-$5",
            monthlyData: [
              { month: "JUL", value: 30 },
              { month: "AUG", value: 32 },
              { month: "SEP", value: 35 },
              { month: "OCT", value: 38 },
              { month: "NOV", value: 40 },
              { month: "DEC", value: 42 },
            ],
            quarterlyData: [
              { month: "Q1", value: 90 },
              { month: "Q2", value: 95 },
              { month: "Q3", value: 105 },
              { month: "Q4", value: 130 },
            ],
            prevYearMonthlyData: [
              { month: "JUL", value: 25 },
              { month: "AUG", value: 28 },
              { month: "SEP", value: 30 },
              { month: "OCT", value: 32 },
              { month: "NOV", value: 35 },
              { month: "DEC", value: 38 },
            ],
            prevYearQuarterlyData: [
              { month: "Q1", value: 75 },
              { month: "Q2", value: 82 },
              { month: "Q3", value: 90 },
              { month: "Q4", value: 110 },
            ],
            chartColor: "#14b8a6", // teal
            ltv: "$1,850",
            ltvChange: "+8%",
            repeatRate: "68.4%",
            repeatRateChange: "+1.2%",
          }
          break
        case "germany":
          data = {
            ...data,
            revenue: "$310K",
            conversionRate: "1.8%",
            conversionChange: "+0.2%",
            avgOrderValue: "$580",
            avgOrderChange: "+$35",
            customerAcquisition: "$120",
            customerAcquisitionChange: "-$15",
            monthlyData: [
              { month: "JUL", value: 22 },
              { month: "AUG", value: 24 },
              { month: "SEP", value: 26 },
              { month: "OCT", value: 28 },
              { month: "NOV", value: 30 },
              { month: "DEC", value: 32 },
            ],
            quarterlyData: [
              { month: "Q1", value: 65 },
              { month: "Q2", value: 72 },
              { month: "Q3", value: 78 },
              { month: "Q4", value: 95 },
            ],
            prevYearMonthlyData: [
              { month: "JUL", value: 18 },
              { month: "AUG", value: 20 },
              { month: "SEP", value: 22 },
              { month: "OCT", value: 24 },
              { month: "NOV", value: 26 },
              { month: "DEC", value: 28 },
            ],
            prevYearQuarterlyData: [
              { month: "Q1", value: 55 },
              { month: "Q2", value: 60 },
              { month: "Q3", value: 65 },
              { month: "Q4", value: 75 },
            ],
            chartColor: "#22c55e", // green
            ltv: "$3,200",
            ltvChange: "+5%",
            repeatRate: "72.1%",
            repeatRateChange: "+0.5%",
          }
          break
        case "japan":
          data = {
            ...data,
            revenue: "$180K",
            conversionRate: "5.2%",
            conversionChange: "+1.2%",
            avgOrderValue: "$85",
            avgOrderChange: "+$8",
            customerAcquisition: "$28",
            customerAcquisitionChange: "-$6",
            monthlyData: [
              { month: "JUL", value: 12 },
              { month: "AUG", value: 15 },
              { month: "SEP", value: 14 },
              { month: "OCT", value: 16 },
              { month: "NOV", value: 18 },
              { month: "DEC", value: 22 },
            ],
            quarterlyData: [
              { month: "Q1", value: 35 },
              { month: "Q2", value: 42 },
              { month: "Q3", value: 45 },
              { month: "Q4", value: 58 },
            ],
            prevYearMonthlyData: [
              { month: "JUL", value: 10 },
              { month: "AUG", value: 12 },
              { month: "SEP", value: 11 },
              { month: "OCT", value: 13 },
              { month: "NOV", value: 15 },
              { month: "DEC", value: 18 },
            ],
            prevYearQuarterlyData: [
              { month: "Q1", value: 28 },
              { month: "Q2", value: 32 },
              { month: "Q3", value: 35 },
              { month: "Q4", value: 45 },
            ],
            chartColor: "#f59e0b", // amber
            ltv: "$520",
            ltvChange: "+15%",
            repeatRate: "45.8%",
            repeatRateChange: "+3.2%",
          }
          break
      }
    }

    return data
  }

  const subsidiaryData = getSubsidiaryData()

  useEffect(() => {
    if (highlightItem === "revenue-forecast") {
      // Scroll to the relevant element and highlight it
      setTimeout(() => {
        const element = document.getElementById("revenue-forecast-card")
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center", // Center the element in the viewport
          })

          // Start with no highlight but add transition classes
          element.classList.add("transition-all", "duration-1500")

          // Fade in slowly
          setTimeout(() => {
            element.classList.add("bg-zamora-purple/10", "border-l-4", "border-zamora-purple", "pl-2")

            // Fade out slowly after a delay
            setTimeout(() => {
              element.classList.remove("bg-zamora-purple/10")
              element.classList.add("bg-transparent")

              // After fade out completes, remove the border
              setTimeout(() => {
                element.classList.remove("border-l-4", "border-zamora-purple", "pl-2")
              }, 1500)
            }, 3000)
          }, 500) // Short delay before starting fade in
        }
      }, 300)
    }
  }, [highlightItem])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Business Metrics</h1>
        <p className="text-muted-foreground">Key performance indicators and business analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleWidgets.revenue && (
          <div
            className={`${
              widgetSizesLocal.revenue === "large"
                ? "md:col-span-2 lg:col-span-2"
                : widgetSizesLocal.revenue === "small"
                  ? "lg:col-span-1"
                  : "lg:col-span-1"
            }`}
          >
            {widgetSizesLocal.revenue === "small" ? (
              <SmallWidget title="Revenue Performance" value="$1.24M" color="purple" />
            ) : (
              <Card className="relative">
                <WidgetMenu
                  onRemove={() => handleRemoveWidget("revenue")}
                  onCustomize={() => {
                    /* Handle customize */
                  }}
                  onRearrange={() => {
                    /* Handle rearrange */
                  }}
                  onResize={(size) => handleResizeWidget("revenue", size)}
                  currentSize={widgetSizesLocal.revenue}
                />
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-zamora-purple" />
                    <div className="text-sm text-muted-foreground">Revenue</div>
                  </div>
                  <CardTitle className="text-2xl text-zamora-purple">{subsidiaryData.revenue}</CardTitle>
                  <div className="flex justify-end mt-1">
                    <Tabs defaultValue="month" value={revenueTimePeriod} onValueChange={setRevenueTimePeriod}>
                      <TabsList className="bg-secondary h-6">
                        <TabsTrigger
                          value="month"
                          className="text-xs h-4 px-2 data-[state=active]:bg-zamora-purple data-[state=active]:text-white"
                        >
                          M
                        </TabsTrigger>
                        <TabsTrigger
                          value="quarter"
                          className="text-xs h-4 px-2 data-[state=active]:bg-zamora-purple data-[state=active]:text-white"
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
                      color={subsidiaryData.chartColor}
                      data={revenueTimePeriod === "month" ? subsidiaryData.monthlyData : subsidiaryData.quarterlyData}
                      compareData={
                        revenueTimePeriod === "month"
                          ? subsidiaryData.prevYearMonthlyData
                          : subsidiaryData.prevYearQuarterlyData
                      }
                      compareLabel="Previous Year"
                      valueFormatter={(value) => `$${value}K`}
                    />
                  </div>
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-2">
                      <span className="font-medium text-zamora-purple">Updated Forecast:</span> Q4 revenue projections
                      increased by 8% based on current growth trends
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
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

