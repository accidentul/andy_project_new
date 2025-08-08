"use client"

import { AlertCircle, Brain, Lightbulb, TrendingUp, Shield, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, UserPlus } from "lucide-react"

interface AIInsightsSectionProps {
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

export function AIInsightsSection({ highlightItem, subsidiary }: AIInsightsSectionProps) {
  const [activeTab, setActiveTab] = useState("opportunities")
  const [retentionPlanOpen, setRetentionPlanOpen] = useState(false)
  const [planExecuted, setPlanExecuted] = useState(false)
  const [activeOpportunity, setActiveOpportunity] = useState<string | null>(null)
  const [showActionPlan, setShowActionPlan] = useState(false)
  const [actionExecuted, setActionExecuted] = useState(false)
  const [executionMode, setExecutionMode] = useState<"human-guided" | "ai-automated">("human-guided")

  useEffect(() => {
    if (highlightItem === "churn-risk-detection") {
      setActiveTab("anomalies")

      // Scroll to the relevant element and highlight it
      setTimeout(() => {
        const element = document.getElementById("churn-risk-alert")
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

  const getSubsidiarySpecificInsight = () => {
    if (!subsidiary || subsidiary.id === "global") {
      return null
    }

    // Return subsidiary-specific insights
    switch (subsidiary.id) {
      case "us":
        return {
          title: "US Market Opportunity",
          description: "AI analysis shows 28% growth potential in West Coast enterprise segment",
          impact: "+$1.2M projected revenue",
          time: "Detected 4 hours ago",
          type: "opportunity",
        }
      case "uk":
        return {
          title: "Brexit Impact Analysis",
          description: "Post-Brexit regulatory changes create new compliance requirements for 15% of customers",
          impact: "Compliance strategy needed",
          time: "Detected 6 hours ago",
          type: "action",
        }
      case "germany":
        return {
          title: "German Market Expansion",
          description: "Opportunity to expand into neighboring markets with 22% lower customer acquisition costs",
          impact: "+$850K revenue opportunity",
          time: "Detected 3 hours ago",
          type: "opportunity",
        }
      case "japan":
        return {
          title: "APAC Supply Chain Optimization",
          description: "AI identified 3 alternative suppliers that can reduce costs by 18% while maintaining quality",
          impact: "-$420K in annual costs",
          time: "Detected 5 hours ago",
          type: "opportunity",
        }
      default:
        return null
    }
  }

  const subsidiaryInsight = getSubsidiarySpecificInsight()

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">andi's Insights</h1>
          <p className="text-muted-foreground">Adaptive Neural Data Intelligence analysis</p>
        </div>
        <Button className="bg-zamora-purple hover:bg-zamora-purple-dark">
          <Brain className="mr-2 h-4 w-4" /> Generate New Insights
        </Button>
      </div>

      <Tabs defaultValue="opportunities" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-secondary">
          <TabsTrigger
            value="opportunities"
            className="data-[state=active]:bg-zamora-purple data-[state=active]:text-white"
          >
            Opportunities
          </TabsTrigger>
          <TabsTrigger
            value="anomalies"
            className="data-[state=active]:bg-zamora-purple data-[state=active]:text-white"
          >
            Anomalies
          </TabsTrigger>
          <TabsTrigger
            value="predictions"
            className="data-[state=active]:bg-zamora-purple data-[state=active]:text-white"
          >
            Predictions
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "opportunities" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 p-1 rounded-full bg-green-500/10 border-green-500/30">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Customer Behavior Pattern
                    <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/50">
                      <Shield className="h-3 w-3 mr-1" />
                      <span>High Impact</span>
                    </Badge>
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">Detected 2 hours ago</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Premium customers are 3.2x more likely to purchase after viewing educational content
              </p>
              <div className="flex items-center justify-between">
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                  +$32,400 revenue opportunity
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveOpportunity("customer-behavior")
                    setShowActionPlan(false)
                    setActionExecuted(false)
                  }}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 p-1 rounded-full bg-green-500/10 border-green-500/30">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Pricing Elasticity Analysis
                    <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/50">
                      <Shield className="h-3 w-3 mr-1" />
                      <span>High Impact</span>
                    </Badge>
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">Detected 4 hours ago</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">7 products have room for 5-12% price increases without affecting demand</p>
              <div className="flex items-center justify-between">
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">+$48,500 projected revenue</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveOpportunity("pricing-elasticity")
                    setShowActionPlan(false)
                    setActionExecuted(false)
                  }}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 p-1 rounded-full bg-green-500/10 border-green-500/30">
                  <Lightbulb className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Seasonal Trend Prediction
                    <Badge className="bg-teal-500/20 text-teal-500 border-teal-500/50">
                      <Zap className="h-3 w-3 mr-1" />
                      <span>Low Impact</span>
                    </Badge>
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">Detected 6 hours ago</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Expect 28% increase in Category B demand starting next month based on 3-year pattern
              </p>
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Inventory planning required</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveOpportunity("seasonal-trend")
                    setShowActionPlan(false)
                    setActionExecuted(false)
                  }}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 p-1 rounded-full bg-green-500/10 border-green-500/30">
                  <Lightbulb className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Competitor Strategy Change
                    <Badge className="bg-teal-500/20 text-teal-500 border-teal-500/50">
                      <Zap className="h-3 w-3 mr-1" />
                      <span>Low Impact</span>
                    </Badge>
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">Detected 8 hours ago</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Main competitor has shifted marketing focus to sustainability messaging</p>
              <div className="flex items-center justify-between">
                <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">
                  Market positioning opportunity
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveOpportunity("competitor-strategy")
                    setShowActionPlan(false)
                    setActionExecuted(false)
                  }}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "anomalies" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card id="churn-risk-alert" className="transition-all duration-300">
            <CardHeader>
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 p-1 rounded-full bg-red-500/10 border-red-500/30">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Enterprise Customer Churn Risk
                    <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/50">
                      <Shield className="h-3 w-3 mr-1" />
                      <span>High Impact</span>
                    </Badge>
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">Detected 25 minutes ago</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                AI analysis has identified 5 enterprise customers showing early warning signs of potential churn:
              </p>
              <ul className="list-disc pl-5 mb-4 space-y-1 text-sm">
                <li>Decreased product usage (-32% in last 30 days)</li>
                <li>Support ticket increases (+28%)</li>
                <li>Delayed invoice payments</li>
                <li>Reduced feature adoption</li>
                <li>Competitor engagement signals</li>
              </ul>
              <div className="flex items-center justify-between">
                <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
                  High priority - $420K ARR at risk
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setRetentionPlanOpen(true)}>
                  View Retention Plan
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 p-1 rounded-full bg-amber-500/10 border-amber-500/30">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Unusual Website Traffic
                    <Badge className="bg-teal-500/20 text-teal-500 border-teal-500/50">
                      <Zap className="h-3 w-3 mr-1" />
                      <span>Low Impact</span>
                    </Badge>
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">Detected 1 hour ago</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">42% increase in mobile traffic from new geographic region</p>
              <div className="flex items-center justify-between">
                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                  Investigate marketing attribution
                </Badge>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "predictions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Revenue Forecast
                <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/50">
                  <Shield className="h-3 w-3 mr-1" />
                  <span>High Impact</span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-zamora-purple">+18.2%</div>
                <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">92% Confidence</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Next Quarter</p>
              <p className="mt-4 text-sm">Seasonal trends and new product launches will drive growth</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Customer Acquisition
                <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/50">
                  <Shield className="h-3 w-3 mr-1" />
                  <span>High Impact</span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-zamora-blue">+124</div>
                <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">88% Confidence</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Next Month</p>
              <p className="mt-4 text-sm">Digital channel optimization will improve conversion rates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Churn Risk
                <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/50">
                  <Shield className="h-3 w-3 mr-1" />
                  <span>High Impact</span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-amber-500">24 customers</div>
                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">94% Confidence</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Next 30 days</p>
              <p className="mt-4 text-sm">Enterprise segment shows early warning signals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Inventory Needs
                <Badge className="bg-teal-500/20 text-teal-500 border-teal-500/50">
                  <Zap className="h-3 w-3 mr-1" />
                  <span>Low Impact</span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-zamora-teal">+15% SKU-42X</div>
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">90% Confidence</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Next Quarter</p>
              <p className="mt-4 text-sm">Demand spike predicted based on market trends</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={retentionPlanOpen} onOpenChange={setRetentionPlanOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-h-none sm:overflow-y-visible">
          <DialogHeader>
            <DialogTitle>Enterprise Customer Retention Plan</DialogTitle>
            <DialogDescription>AI-generated plan to address churn risk for 5 enterprise customers</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 my-2 sm:my-4">
            <div className="bg-muted p-2 sm:p-4 rounded-lg">
              <h3 className="font-medium mb-2">Risk Assessment Summary</h3>
              <p className="text-sm text-muted-foreground mb-2">
                5 enterprise customers showing early warning signs with $420K ARR at risk
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mt-2 sm:mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <span>Acme Corp: $120K ARR</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                  <span>TechGiant: $85K ARR</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <span>DataSystems: $95K ARR</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                  <span>CloudNine: $60K ARR</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                  <span>InnovateTech: $60K ARR</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Recommended Actions</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Schedule executive check-in calls with all 5 accounts within 48 hours</li>
                <li>Offer complimentary technical review sessions to address support issues</li>
                <li>Provide 3-month extension on current pricing tier for renewal commitments</li>
                <li>Assign dedicated Customer Success Manager to high-risk accounts</li>
                <li>Develop custom feature adoption plan for each account</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Expected Outcomes</h3>
              <p className="text-sm text-muted-foreground">
                Implementing this plan has an 82% probability of retaining at least 4 of 5 at-risk customers, preserving
                approximately $340K in annual recurring revenue.
              </p>
            </div>
          </div>

          {planExecuted ? (
            <div className="bg-background border border-muted-foreground/30 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground text-sm">Plan execution initiated</h4>
                <p className="text-xs text-foreground">
                  Customer Success team has been notified. Sarah Johnson (CS Director) has been added to the workflow
                  and will coordinate the executive outreach within 24 hours.
                </p>
              </div>
            </div>
          ) : (
            <DialogFooter>
              <Button variant="outline" onClick={() => setRetentionPlanOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-zamora-purple hover:bg-zamora-purple-dark" onClick={() => setPlanExecuted(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Execute Plan with Human Oversight
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={activeOpportunity !== null} onOpenChange={(open) => !open && setActiveOpportunity(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-h-none sm:overflow-y-visible">
          <DialogHeader>
            <DialogTitle>
              {activeOpportunity === "customer-behavior" && "Customer Behavior Pattern Opportunity"}
              {activeOpportunity === "pricing-elasticity" && "Pricing Elasticity Analysis Opportunity"}
              {activeOpportunity === "seasonal-trend" && "Seasonal Trend Prediction Opportunity"}
              {activeOpportunity === "competitor-strategy" && "Competitor Strategy Change Opportunity"}
            </DialogTitle>
            <DialogDescription>
              {activeOpportunity === "customer-behavior" &&
                "Premium customers are 3.2x more likely to purchase after viewing educational content"}
              {activeOpportunity === "pricing-elasticity" &&
                "7 products have room for 5-12% price increases without affecting demand"}
              {activeOpportunity === "seasonal-trend" &&
                "Expect 28% increase in Category B demand starting next month based on 3-year pattern"}
              {activeOpportunity === "competitor-strategy" &&
                "Main competitor has shifted marketing focus to sustainability messaging"}
            </DialogDescription>
          </DialogHeader>

          {!showActionPlan ? (
            <div className="space-y-3 sm:space-y-4 my-2 sm:my-4">
              {activeOpportunity === "customer-behavior" && (
                <>
                  <div className="bg-muted p-2 sm:p-4 rounded-lg">
                    <h3 className="font-medium mb-1 sm:mb-2 text-sm">Opportunity Analysis</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
                      Our AI has analyzed customer behavior patterns across 18 months of data and discovered a
                      significant correlation between educational content consumption and purchase behavior among
                      premium tier customers.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mt-2 sm:mt-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span>3.2x higher conversion rate</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span>42% larger average order value</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                        <span>28% increase in repeat purchases</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                        <span>$32,400 revenue opportunity</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">How to Achieve This Opportunity</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Create targeted educational content journeys for premium customers</li>
                      <li>Implement personalized content recommendations based on purchase history</li>
                      <li>Develop automated email sequences highlighting relevant educational content</li>
                      <li>Add educational content widgets to product pages for premium customers</li>
                      <li>Create exclusive webinars and tutorials for premium tier members</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Expected Outcomes</h3>
                    <p className="text-sm text-muted-foreground">
                      Implementing this strategy has an 87% probability of generating $32,400 in additional revenue
                      within the next quarter, with minimal resource investment required.
                    </p>
                  </div>
                </>
              )}

              {activeOpportunity === "pricing-elasticity" && (
                <>
                  <div className="bg-muted p-2 sm:p-4 rounded-lg">
                    <h3 className="font-medium mb-1 sm:mb-2 text-sm">Opportunity Analysis</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
                      Our AI has analyzed pricing sensitivity across your product catalog and identified 7 specific
                      products where price increases of 5-12% would not negatively impact demand or sales volume.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mt-2 sm:mt-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span>7 products identified</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span>5-12% price increase potential</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                        <span>No projected volume decrease</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                        <span>$48,500 revenue opportunity</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">How to Achieve This Opportunity</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Implement staged price increases across the 7 identified products</li>
                      <li>Update pricing on website and in sales materials</li>
                      <li>Brief sales team on value messaging for the affected products</li>
                      <li>Monitor customer response and purchase behavior in real-time</li>
                      <li>Prepare contingency rollback plan if unexpected resistance occurs</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Expected Outcomes</h3>
                    <p className="text-sm text-muted-foreground">
                      Implementing this pricing strategy has a 92% probability of generating $48,500 in additional
                      revenue with no impact on sales volume, resulting in direct profit improvement.
                    </p>
                  </div>
                </>
              )}

              {activeOpportunity === "seasonal-trend" && (
                <>
                  <div className="bg-muted p-2 sm:p-4 rounded-lg">
                    <h3 className="font-medium mb-1 sm:mb-2 text-sm">Opportunity Analysis</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
                      Our AI has analyzed 3 years of seasonal sales data and identified a consistent pattern of
                      increased demand for Category B products starting next month, with an expected 28% increase in
                      sales volume.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mt-2 sm:mt-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span>28% projected demand increase</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span>3-year consistent pattern</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                        <span>Category B products affected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                        <span>Inventory planning required</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">How to Achieve This Opportunity</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Increase inventory levels for Category B products by 30%</li>
                      <li>Coordinate with suppliers to ensure timely delivery</li>
                      <li>Prepare marketing campaigns to capitalize on increased demand</li>
                      <li>Optimize warehouse space for efficient Category B product handling</li>
                      <li>Brief customer service team on expected volume increase</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Expected Outcomes</h3>
                    <p className="text-sm text-muted-foreground">
                      Proper preparation for this seasonal trend has a 94% probability of capturing the full 28%
                      increase in demand, avoiding stockouts and maximizing revenue opportunity.
                    </p>
                  </div>
                </>
              )}

              {activeOpportunity === "competitor-strategy" && (
                <>
                  <div className="bg-muted p-2 sm:p-4 rounded-lg">
                    <h3 className="font-medium mb-1 sm:mb-2 text-sm">Opportunity Analysis</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
                      Our AI has detected a significant shift in your main competitor's marketing strategy, with a new
                      focus on sustainability messaging across their campaigns and product positioning.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mt-2 sm:mt-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span>Competitor strategy shift</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span>Sustainability focus</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                        <span>Market positioning opportunity</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                        <span>Differentiation potential</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">How to Achieve This Opportunity</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>
                        Develop complementary positioning that acknowledges sustainability while emphasizing other
                        unique value propositions
                      </li>
                      <li>Create content highlighting your product's differentiating features</li>
                      <li>Update sales enablement materials to address competitive positioning</li>
                      <li>Train customer-facing teams on new competitive messaging</li>
                      <li>Monitor market response to competitor's sustainability messaging</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Expected Outcomes</h3>
                    <p className="text-sm text-muted-foreground">
                      Implementing a strategic response to this competitor shift has an 85% probability of maintaining
                      market position and potentially gaining share in segments where sustainability is not the primary
                      purchase driver.
                    </p>
                  </div>
                </>
              )}

              <DialogFooter className="flex flex-col sm:flex-row items-center gap-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto mb-2 sm:mb-0"
                  onClick={() => setShowActionPlan(false)}
                >
                  Back to Details
                </Button>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <select
                    className="h-9 sm:h-10 w-full sm:w-auto rounded-md border border-input bg-background px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm ring-offset-background mb-2 sm:mb-0"
                    value={executionMode}
                    onChange={(e) => setExecutionMode(e.target.value as "human-guided" | "ai-automated")}
                  >
                    <option value="human-guided">Human-Guided Execution</option>
                    <option value="ai-automated">Fully AI-Automated</option>
                  </select>
                  <Button
                    className="bg-zamora-purple hover:bg-zamora-purple-dark w-full sm:w-auto"
                    onClick={() => setShowActionPlan(true)}
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Let's Make Things Happen
                  </Button>
                </div>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3 my-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-base">Action Plan</h3>
                <Badge
                  className={
                    executionMode === "human-guided"
                      ? "bg-purple-500/20 text-purple-500 border-purple-500/50"
                      : "bg-teal-500/20 text-teal-500 border-teal-500/50"
                  }
                >
                  {executionMode === "human-guided" ? (
                    <>
                      <Shield className="h-3 w-3 mr-1" /> Human-Guided Execution
                    </>
                  ) : (
                    <>
                      <Zap className="h-3 w-3 mr-1" /> Fully AI-Automated
                    </>
                  )}
                </Badge>
              </div>

              {activeOpportunity === "customer-behavior" && (
                <>
                  <div className="bg-muted p-3 rounded-lg">
                    <h4 className="font-medium mb-0.5 sm:mb-1 text-xs sm:text-sm">Implementation Steps</h4>
                    <ol className="list-decimal pl-3 sm:pl-4 space-y-0.5 sm:space-y-1 text-xs">
                      <li>
                        <strong>Content Audit (Week 1)</strong>
                        <p className="text-muted-foreground">Catalog existing educational content and identify gaps</p>
                        <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                          <Shield className="h-2.5 w-2.5 inline-block mr-1 text-purple-500" /> <strong>Human:</strong>{" "}
                          Marketing team reviews AI analysis
                        </div>
                      </li>
                      <li>
                        <strong>Content Development (Weeks 2-3)</strong>
                        <p className="text-muted-foreground">Create 5 new premium educational content pieces</p>
                        <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                          <Shield className="h-2.5 w-2.5 inline-block mr-1 text-purple-500" /> <strong>Human:</strong>{" "}
                          Content team finalizes creation
                        </div>
                      </li>
                      <li>
                        <strong>Technical Implementation (Week 2)</strong>
                        <p className="text-muted-foreground">Configure recommendation engine for premium customers</p>
                        {executionMode === "human-guided" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Shield className="h-2.5 w-2.5 inline-block mr-1 text-purple-500" /> <strong>Human:</strong>{" "}
                            Engineering reviews changes
                          </div>
                        )}
                        {executionMode === "ai-automated" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Zap className="h-2.5 w-2.5 inline-block mr-1 text-teal-500" /> <strong>AI:</strong>{" "}
                            Auto-configure based on metadata
                          </div>
                        )}
                      </li>
                      <li>
                        <strong>Email Campaign Setup (Week 3)</strong>
                        <p className="text-muted-foreground">Develop automated email sequences</p>
                        {executionMode === "human-guided" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Shield className="h-2.5 w-2.5 inline-block mr-1 text-purple-500" /> <strong>Human:</strong>{" "}
                            Marketing approves sequences
                          </div>
                        )}
                        {executionMode === "ai-automated" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Zap className="h-2.5 w-2.5 inline-block mr-1 text-teal-500" /> <strong>AI:</strong>{" "}
                            Generate templates and sequences
                          </div>
                        )}
                      </li>
                      <li>
                        <strong>Launch & Monitor (Week 4)</strong>
                        <p className="text-muted-foreground">Deploy changes and monitor metrics</p>
                        {executionMode === "human-guided" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Shield className="h-2.5 w-2.5 inline-block mr-1 text-purple-500" /> <strong>Human:</strong>{" "}
                            Weekly review meetings
                          </div>
                        )}
                        {executionMode === "ai-automated" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Zap className="h-2.5 w-2.5 inline-block mr-1 text-teal-500" /> <strong>AI:</strong>{" "}
                            Real-time optimization
                          </div>
                        )}
                      </li>
                    </ol>
                  </div>

                  <div className="bg-background border border-muted-foreground/30 rounded-lg p-1 sm:p-2">
                    <h4 className="font-medium mb-0.5 sm:mb-1 text-xs text-foreground">Resources Required</h4>
                    <ul className="list-disc pl-3 sm:pl-4 space-y-0.5 text-xs text-foreground">
                      <li>CMS access for {executionMode === "human-guided" ? "3 team members" : "AI service"}</li>
                      <li>Marketing Automation Platform</li>
                      <li>Analytics dashboard setup</li>
                      {executionMode === "human-guided" ? (
                        <li>15 hours content creation time</li>
                      ) : (
                        <li>AI content generation service</li>
                      )}
                    </ul>
                  </div>
                </>
              )}

              {activeOpportunity === "pricing-elasticity" && (
                <>
                  <div className="bg-muted p-3 rounded-lg">
                    <h4 className="font-medium mb-0.5 sm:mb-1 text-xs sm:text-sm">Implementation Steps</h4>
                    <ol className="list-decimal pl-3 sm:pl-4 space-y-0.5 sm:space-y-1 text-xs">
                      <li>
                        <strong>Price Update Schedule (Week 1)</strong>
                        <p className="text-muted-foreground">Create phased implementation schedule</p>
                        {executionMode === "human-guided" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Shield className="h-2.5 w-2.5 inline-block mr-1 text-purple-500" /> <strong>Human:</strong>{" "}
                            Pricing team approves changes
                          </div>
                        )}
                        {executionMode === "ai-automated" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Zap className="h-2.5 w-2.5 inline-block mr-1 text-teal-500" /> <strong>AI:</strong>{" "}
                            Calculate optimal price points
                          </div>
                        )}
                      </li>
                      <li>
                        <strong>System Updates (Week 1)</strong>
                        <p className="text-muted-foreground">Update pricing across all platforms</p>
                        {executionMode === "human-guided" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Shield className="h-2.5 w-2.5 inline-block mr-1 text-purple-500" /> <strong>Human:</strong>{" "}
                            IT verifies updates
                          </div>
                        )}
                        {executionMode === "ai-automated" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Zap className="h-2.5 w-2.5 inline-block mr-1 text-teal-500" /> <strong>AI:</strong>{" "}
                            Auto-update via APIs
                          </div>
                        )}
                      </li>
                      <li>
                        <strong>Sales Enablement (Week 1)</strong>
                        <p className="text-muted-foreground">Prepare updated sales materials</p>
                        {executionMode === "human-guided" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Shield className="h-2.5 w-2.5 inline-block mr-1 text-purple-500" /> <strong>Human:</strong>{" "}
                            Sales leadership approves
                          </div>
                        )}
                      </li>
                      <li>
                        <strong>Monitor & Adjust (Weeks 2-6)</strong>
                        <p className="text-muted-foreground">Track sales volume and feedback</p>
                        {executionMode === "human-guided" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Shield className="h-2.5 w-2.5 inline-block mr-1 text-purple-500" /> <strong>Human:</strong>{" "}
                            Weekly review meetings
                          </div>
                        )}
                        {executionMode === "ai-automated" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Zap className="h-2.5 w-2.5 inline-block mr-1 text-teal-500" /> <strong>AI:</strong>{" "}
                            Continuous monitoring
                          </div>
                        )}
                      </li>
                    </ol>
                  </div>

                  <div className="bg-background border border-muted-foreground/30 rounded-lg p-1 sm:p-2">
                    <h4 className="font-medium mb-0.5 sm:mb-1 text-xs text-foreground">Resources Required</h4>
                    <ul className="list-disc pl-3 sm:pl-4 space-y-0.5 text-xs text-foreground">
                      <li>E-commerce platform access</li>
                      <li>CRM system permissions</li>
                      <li>ERP system access</li>
                      {executionMode === "human-guided" ? (
                        <li>Sales team training (1 hour)</li>
                      ) : (
                        <li>Automated notification system</li>
                      )}
                    </ul>
                  </div>
                </>
              )}

              {activeOpportunity === "seasonal-trend" && (
                <>
                  <div className="bg-muted p-3 rounded-lg">
                    <h4 className="font-medium mb-0.5 sm:mb-1 text-xs sm:text-sm">Implementation Steps</h4>
                    <ol className="list-decimal pl-3 sm:pl-4 space-y-0.5 sm:space-y-1 text-xs">
                      <li>
                        <strong>Inventory Planning (Week 1)</strong>
                        <p className="text-muted-foreground">Calculate inventory needs for 28% increase</p>
                        {executionMode === "human-guided" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Shield className="h-2.5 w-2.5 inline-block mr-1 text-purple-500" /> <strong>Human:</strong>{" "}
                            Inventory team approves plan
                          </div>
                        )}
                        {executionMode === "ai-automated" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Zap className="h-2.5 w-2.5 inline-block mr-1 text-teal-500" /> <strong>AI:</strong>{" "}
                            Auto-calculate inventory needs
                          </div>
                        )}
                      </li>
                      <li>
                        <strong>Supplier Coordination (Week 1)</strong>
                        <p className="text-muted-foreground">Place orders and confirm timelines</p>
                        {executionMode === "human-guided" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Shield className="h-2.5 w-2.5 inline-block mr-1 text-purple-500" /> <strong>Human:</strong>{" "}
                            Procurement finalizes orders
                          </div>
                        )}
                      </li>
                      <li>
                        <strong>Warehouse Preparation (Week 2)</strong>
                        <p className="text-muted-foreground">Optimize layout for increased volume</p>
                        {executionMode === "ai-automated" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Zap className="h-2.5 w-2.5 inline-block mr-1 text-teal-500" /> <strong>AI:</strong>{" "}
                            Generate optimal layout plan
                          </div>
                        )}
                      </li>
                      <li>
                        <strong>Marketing Campaign (Weeks 2-3)</strong>
                        <p className="text-muted-foreground">Develop targeted campaigns</p>
                        {executionMode === "human-guided" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Shield className="h-2.5 w-2.5 inline-block mr-1 text-purple-500" /> <strong>Human:</strong>{" "}
                            Marketing approves campaigns
                          </div>
                        )}
                      </li>
                    </ol>
                  </div>

                  <div className="bg-background border border-muted-foreground/30 rounded-lg p-1 sm:p-2">
                    <h4 className="font-medium mb-0.5 sm:mb-1 text-xs text-foreground">Resources Required</h4>
                    <ul className="list-disc pl-3 sm:pl-4 space-y-0.5 text-xs text-foreground">
                      <li>Inventory management system</li>
                      <li>Supplier portal access</li>
                      <li>Warehouse management system</li>
                      <li>Marketing budget ($5,000)</li>
                    </ul>
                  </div>
                </>
              )}

              {activeOpportunity === "competitor-strategy" && (
                <>
                  <div className="bg-muted p-3 rounded-lg">
                    <h4 className="font-medium mb-0.5 sm:mb-1 text-xs sm:text-sm">Implementation Steps</h4>
                    <ol className="list-decimal pl-3 sm:pl-4 space-y-0.5 sm:space-y-1 text-xs">
                      <li>
                        <strong>Competitive Analysis (Week 1)</strong>
                        <p className="text-muted-foreground">Analyze competitor's sustainability messaging</p>
                        {executionMode === "human-guided" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Shield className="h-2.5 w-2.5 inline-block mr-1 text-purple-500" /> <strong>Human:</strong>{" "}
                            Strategy team reviews analysis
                          </div>
                        )}
                      </li>
                      <li>
                        <strong>Positioning Development (Week 2)</strong>
                        <p className="text-muted-foreground">Create differentiated positioning</p>
                        {executionMode === "human-guided" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Shield className="h-2.5 w-2.5 inline-block mr-1 text-purple-500" /> <strong>Human:</strong>{" "}
                            Marketing approves positioning
                          </div>
                        )}
                        {executionMode === "ai-automated" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Zap className="h-2.5 w-2.5 inline-block mr-1 text-teal-500" /> <strong>AI:</strong>{" "}
                            Generate positioning options
                          </div>
                        )}
                      </li>
                      <li>
                        <strong>Content Creation (Weeks 2-3)</strong>
                        <p className="text-muted-foreground">Develop differentiating content</p>
                        {executionMode === "ai-automated" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Zap className="h-2.5 w-2.5 inline-block mr-1 text-teal-500" /> <strong>AI:</strong>{" "}
                            Auto-generate content
                          </div>
                        )}
                      </li>
                      <li>
                        <strong>Team Training (Week 4)</strong>
                        <p className="text-muted-foreground">Train customer-facing teams</p>
                        {executionMode === "human-guided" && (
                          <div className="mt-0.5 text-xs bg-background p-1 rounded border border-muted-foreground/30">
                            <Shield className="h-2.5 w-2.5 inline-block mr-1 text-purple-500" /> <strong>Human:</strong>{" "}
                            Sales leaders conduct training
                          </div>
                        )}
                      </li>
                    </ol>
                  </div>

                  <div className="bg-background border border-muted-foreground/30 rounded-lg p-1 sm:p-2">
                    <h4 className="font-medium mb-0.5 sm:mb-1 text-xs text-foreground">Resources Required</h4>
                    <ul className="list-disc pl-3 sm:pl-4 space-y-0.5 text-xs text-foreground">
                      <li>Competitive intelligence platform</li>
                      <li>Content management system</li>
                      <li>Sales enablement platform</li>
                      <li>
                        {executionMode === "human-guided" ? "Training sessions (2 hours)" : "AI content generation"}
                      </li>
                    </ul>
                  </div>
                </>
              )}

              {actionExecuted ? (
                <div className="bg-background border border-muted-foreground/30 rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground text-sm">
                      {executionMode === "human-guided"
                        ? "Action plan approved with human oversight"
                        : "AI-automated execution initiated"}
                    </h4>
                    <p className="text-xs text-foreground">
                      {executionMode === "human-guided"
                        ? "Implementation initiated with human oversight. Team members notified and resources allocated."
                        : "AI system has begun automated implementation. All steps will execute with real-time optimization."}
                    </p>
                  </div>
                </div>
              ) : (
                <DialogFooter className="flex flex-col sm:flex-row items-center gap-2">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto mb-2 sm:mb-0"
                    onClick={() => setShowActionPlan(false)}
                  >
                    Back to Details
                  </Button>
                  <Button
                    className="bg-zamora-purple hover:bg-zamora-purple-dark w-full sm:w-auto"
                    onClick={() => setActionExecuted(true)}
                  >
                    {executionMode === "human-guided" ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirm Human-Guided Execution
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Confirm AI-Automated Execution
                      </>
                    )}
                  </Button>
                </DialogFooter>
              )}
              {actionExecuted && (
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setActiveOpportunity(null)
                      setShowActionPlan(false)
                      setActionExecuted(false)
                    }}
                  >
                    OK
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

