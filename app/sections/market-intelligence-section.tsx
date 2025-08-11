"use client"

import { Activity, BarChart3, Globe, PieChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { BarChart } from "../components/bar-chart"
import { LineChart } from "../components/line-chart"

// Import Dialog components at the top of the file
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Add subsidiary prop to the MarketIntelligenceSection component
interface MarketIntelligenceSectionProps {
  highlightItem?: string | null
  subsidiary?: {
    id: string
    name: string
    region: string
    employees: number
    revenue: string
    color: string
  }
}

export function MarketIntelligenceSection({ highlightItem, subsidiary }: MarketIntelligenceSectionProps) {
  const [activeTab, setActiveTab] = useState("market")

  // Add state for tracking which dialog is open
  const [openDialog, setOpenDialog] = useState<string | null>(null)

  // Add this function to get subsidiary-specific market data
  const getSubsidiaryMarketData = () => {
    // Default data for global
    let data = {
      marketShare: "28.4%",
      marketShareChange: "+1.2%",
      competitorActivity: "High",
      competitorActivityChange: "+24%",
      marketGrowth: "6.8%",
      marketGrowthChange: "+0.4%",
      chartColor: "#c44ed9", // purple
      competitorInsight: "Main competitor reduced prices on premium product line by 12% this week",
      marketOpportunity: "Underserved segment identified in geographic region with 28% growth potential",
    }

    // Subsidiary-specific data
    if (subsidiary) {
      switch (subsidiary.id) {
        case "us":
          data = {
            ...data,
            marketShare: "32.5%",
            marketShareChange: "+2.1%",
            competitorActivity: "Very High",
            competitorActivityChange: "+35%",
            marketGrowth: "7.2%",
            marketGrowthChange: "+0.6%",
            chartColor: "#3b82f6", // blue
            competitorInsight: "US competitor launched new AI-powered product line targeting enterprise customers",
            marketOpportunity: "West Coast SMB market showing 42% growth potential with minimal competition",
          }
          break
        case "uk":
          data = {
            ...data,
            marketShare: "24.8%",
            marketShareChange: "+0.8%",
            competitorActivity: "Moderate",
            competitorActivityChange: "+15%",
            marketGrowth: "5.4%",
            marketGrowthChange: "+0.2%",
            chartColor: "#14b8a6", // teal
            competitorInsight: "UK market leader struggling with post-Brexit supply chain issues",
            marketOpportunity: "Financial services sector in London showing 18% growth despite market conditions",
          }
          break
        case "germany":
          data = {
            ...data,
            marketShare: "18.2%",
            marketShareChange: "+1.5%",
            competitorActivity: "High",
            competitorActivityChange: "+22%",
            marketGrowth: "4.8%",
            marketGrowthChange: "+0.3%",
            chartColor: "#22c55e", // green
            competitorInsight: "German competitor acquired smaller regional player to consolidate market position",
            marketOpportunity:
              "Manufacturing sector in southern Germany showing strong demand for automation solutions",
          }
          break
        case "japan":
          data = {
            ...data,
            marketShare: "12.6%",
            marketShareChange: "+2.4%",
            competitorActivity: "Moderate",
            competitorActivityChange: "+18%",
            marketGrowth: "3.8%",
            marketGrowthChange: "+0.5%",
            chartColor: "#f59e0b", // amber
            competitorInsight: "Local Japanese competitors focusing heavily on traditional market segments",
            marketOpportunity: "Emerging tech sector in Tokyo showing 32% growth with limited competition",
          }
          break
      }
    }

    return data
  }

  // Add this after the useState declarations
  useEffect(() => {
    if (highlightItem === "competitor-price-change") {
      setActiveTab("competitors")

      // Scroll to the relevant element and highlight it
      setTimeout(() => {
        const element = document.getElementById("competitor-price-changes")
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

  const marketData = getSubsidiaryMarketData()

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Market Intelligence</h1>
          <p className="text-muted-foreground">Competitive analysis and market trends</p>
        </div>
        <Button className="bg-zamora-purple hover:bg-zamora-purple-dark">
          <Globe className="mr-2 h-4 w-4" /> Refresh Market Data
        </Button>
      </div>

      <Tabs defaultValue="market" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="market" className="data-[state=active]:bg-zamora-purple data-[state=active]:text-white">
            Market Overview
          </TabsTrigger>
          <TabsTrigger
            value="competitors"
            className="data-[state=active]:bg-zamora-purple data-[state=active]:text-white"
          >
            Competitors
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-zamora-purple data-[state=active]:text-white">
            Trends
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Replace the grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 section with this updated version
      that includes clickable icons and dialogs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Share</CardTitle>
            <Dialog
              open={openDialog === "marketShare"}
              onOpenChange={(open) => setOpenDialog(open ? "marketShare" : null)}
            >
              <DialogTrigger asChild>
                <PieChart className="h-4 w-4 text-zamora-purple cursor-pointer hover:text-zamora-purple-light transition-colors" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Market Share Analysis</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Competitor Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: marketData.chartColor }}
                          ></div>
                          <span className="text-sm">Your Company</span>
                        </div>
                        <span className="font-medium">{marketData.marketShare}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                          <span className="text-sm">Competitor A</span>
                        </div>
                        <span className="font-medium">24.7%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm">Competitor B</span>
                        </div>
                        <span className="font-medium">18.2%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                          <span className="text-sm">Competitor C</span>
                        </div>
                        <span className="font-medium">15.6%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                          <span className="text-sm">Others</span>
                        </div>
                        <span className="font-medium">13.1%</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-2">Market Share Trend</h3>
                    <div className="h-[200px]">
                      <LineChart
                        color={marketData.chartColor}
                        data={[
                          { month: "Q1 2023", value: 26.8 },
                          { month: "Q2 2023", value: 27.2 },
                          { month: "Q3 2023", value: 27.9 },
                          { month: "Q4 2023", value: Number.parseFloat(marketData.marketShare) },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketData.marketShare}</div>
            <div className="text-sm text-muted-foreground">
              <span className="text-xs text-green-500">{marketData.marketShareChange}</span>
              <span className="ml-1 text-slate-400">vs Last Quarter</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Competitor Activity</CardTitle>
            <Dialog
              open={openDialog === "competitorActivity"}
              onOpenChange={(open) => setOpenDialog(open ? "competitorActivity" : null)}
            >
              <DialogTrigger asChild>
                <Activity className="h-4 w-4 text-amber-500 cursor-pointer hover:text-amber-400 transition-colors" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Competitor Activity Analysis</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Digital Ad Spend by Competitor</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                          <span className="text-sm">Competitor A</span>
                        </div>
                        <span className="font-medium">+32% YoY</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm">Competitor B</span>
                        </div>
                        <span className="font-medium">+18% YoY</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                          <span className="text-sm">Competitor C</span>
                        </div>
                        <span className="font-medium">+24% YoY</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-2">Recent Competitor Initiatives</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-secondary rounded-md">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                          <span className="text-sm font-medium">Competitor A</span>
                        </div>
                        <p className="text-xs mt-1">Launched new premium tier with AI-powered features</p>
                        <p className="text-xs text-amber-500 mt-1">Potential threat to enterprise segment</p>
                      </div>
                      <div className="p-3 bg-secondary rounded-md">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm font-medium">Competitor B</span>
                        </div>
                        <p className="text-xs mt-1">Reduced prices by 15% for small business plans</p>
                        <p className="text-xs text-amber-500 mt-1">May impact SMB customer acquisition</p>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketData.competitorActivity}</div>
            <div className="text-sm text-muted-foreground">
              <span className="text-xs text-amber-500">{marketData.competitorActivityChange}</span>
              <span className="ml-1 text-slate-400">Digital Ad Spend</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Growth</CardTitle>
            <Dialog
              open={openDialog === "marketGrowth"}
              onOpenChange={(open) => setOpenDialog(open ? "marketGrowth" : null)}
            >
              <DialogTrigger asChild>
                <BarChart3 className="h-4 w-4 text-zamora-blue cursor-pointer hover:text-blue-400 transition-colors" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Market Growth Analysis</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Growth by Market Segment</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm">Enterprise</div>
                          <div className="text-sm text-zamora-blue">8.2%</div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-zamora-blue rounded-full" style={{ width: "82%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm">Mid-Market</div>
                          <div className="text-sm text-zamora-blue">6.5%</div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-zamora-blue rounded-full" style={{ width: "65%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm">Small Business</div>
                          <div className="text-sm text-zamora-blue">5.4%</div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-zamora-blue rounded-full" style={{ width: "54%" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-2">Growth Forecast</h3>
                    <div className="h-[200px]">
                      <BarChart
                        color="#3b82f6"
                        data={[
                          { country: "2023", value: 6.8 },
                          { country: "2024", value: 7.2 },
                          { country: "2025", value: 8.1 },
                          { country: "2026", value: 8.5 },
                        ]}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Projected annual market growth rate (%)</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketData.marketGrowth}</div>
            <div className="text-sm text-muted-foreground">
              <span className="text-xs text-green-500">{marketData.marketGrowthChange}</span>
              <span className="ml-1 text-slate-400">Annual Rate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeTab === "market" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Share by Region</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <BarChart
                  color={marketData.chartColor}
                  data={[
                    { country: "North America", value: 35 },
                    { country: "Europe", value: 25 },
                    { country: "Asia Pacific", value: 20 },
                    { country: "Latin America", value: 12 },
                    { country: "Middle East", value: 8 },
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Market Growth Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <LineChart
                  color="#3b82f6"
                  data={[
                    { month: "Q1 2023", value: 65 },
                    { month: "Q2 2023", value: 68 },
                    { month: "Q3 2023", value: 72 },
                    { month: "Q4 2023", value: 75 },
                    { month: "Q1 2024", value: 78 },
                    { month: "Q2 2024", value: 82 },
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "competitors" && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  id="competitor-price-changes"
                  className="flex items-start space-x-3 p-4 bg-secondary rounded-md transition-all duration-300"
                >
                  <div>
                    <h3 className="text-sm font-medium">Competitor Price Changes</h3>
                    <p className="text-xs text-muted-foreground mt-1">{marketData.competitorInsight}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                        Potential market share impact
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-secondary rounded-md">
                  <div>
                    <h3 className="text-sm font-medium">New Market Entrant</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Direct-to-consumer brand launched in your category with venture funding
                    </p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                        Monitor digital marketing tactics
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-secondary rounded-md">
                  <div>
                    <h3 className="text-sm font-medium">Competitor Feature Launch</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Top competitor launched AI-powered recommendation engine for customers
                    </p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Strategic threat</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "trends" && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-secondary rounded-md">
                  <div>
                    <h3 className="text-sm font-medium">Sustainability Focus</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      72% increase in consumer preference for sustainable products in your category
                    </p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                        Product development opportunity
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-secondary rounded-md">
                  <div>
                    <h3 className="text-sm font-medium">Mobile Commerce Growth</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mobile transactions increased 38% year-over-year across the industry
                    </p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                        Mobile experience optimization needed
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-secondary rounded-md">
                  <div>
                    <h3 className="text-sm font-medium">Emerging Market Opportunity</h3>
                    <p className="text-xs text-muted-foreground mt-1">{marketData.marketOpportunity}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                        Expansion opportunity
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

