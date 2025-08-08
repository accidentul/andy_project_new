"use client"

import type React from "react"

import { Check, Plus, X, Shield, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AutomatedAction {
  id: number
  title: string
  description: string | React.ReactNode
  status: "completed" | "in_progress" | "pending_approval"
  time: string
  impact: string
  impactLevel: "high" | "low"
}

// Add subsidiary prop to the AutomatedActionsSection component
interface AutomatedActionsSectionProps {
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

// Update the component to use subsidiary-specific data
export function AutomatedActionsSection({ highlightItem, subsidiary }: AutomatedActionsSectionProps) {
  // Add this function to get subsidiary-specific actions
  const getSubsidiaryActions = () => {
    // Default actions for global
    let actions = [
      {
        id: 1,
        title: "Customer Churn Prevention",
        description:
          "Identified 24 high-risk customers and initiated personalized retention campaigns with targeted 15% discount offers and priority support access",
        status: "completed",
        time: "2 hours ago",
        impact: "+$45,200 projected revenue saved",
        impactLevel: "high" as const,
      },
      {
        id: 2,
        title: "Inventory Optimization",
        description:
          "Adjusted stock levels for 15 products based on seasonal demand forecast, reducing SKU-42X by 30% and increasing SKU-78B by 45% to match projected holiday demand",
        status: "in_progress",
        time: "Ongoing",
        impact: "-$12,400 in carrying costs",
        impactLevel: "low" as const,
      },
      {
        id: 3,
        title: "Marketing Budget Reallocation",
        description:
          "Shifted $5,000 from underperforming channels to high-ROI campaigns based on 90-day performance analysis",
        status: "pending_approval",
        time: "Awaiting approval",
        impact: "+$18,500 projected revenue",
        impactLevel: "high" as const,
      },
      {
        id: 4,
        title: "Email Campaign Optimization",
        description:
          "Automatically adjusted email send times based on recipient engagement patterns, increasing open rates by 18%",
        status: "completed",
        time: "1 day ago",
        impact: "+8% click-through rate",
        impactLevel: "low" as const,
      },
      {
        id: 5,
        title: "Support Ticket Categorization",
        description:
          "AI-powered system categorized and prioritized incoming support tickets, reducing response time by 32%",
        status: "completed",
        time: "3 days ago",
        impact: "Customer satisfaction +12%",
        impactLevel: "low" as const,
      },
    ]

    // Subsidiary-specific actions
    if (subsidiary) {
      switch (subsidiary.id) {
        case "us":
          actions = [
            {
              id: 1,
              title: "US Digital Campaign Optimization",
              description: "Reallocated $12,000 from traditional media to digital channels based on ROI analysis",
              status: "completed",
              time: "1 day ago",
              impact: "+$32,400 projected revenue",
              impactLevel: "high" as const,
            },
            {
              id: 2,
              title: "West Coast Expansion",
              description:
                "Automated hiring process for 5 new sales positions in Los Angeles and San Francisco offices",
              status: "in_progress",
              time: "Ongoing",
              impact: "+$180,000 annual revenue target",
              impactLevel: "high" as const,
            },
            {
              id: 3,
              title: "Enterprise Client Discount Program",
              description: "Proposed 8% loyalty discount for enterprise clients renewing multi-year contracts",
              status: "pending_approval",
              time: "Awaiting approval",
              impact: "+$240,000 secured annual revenue",
              impactLevel: "high" as const,
            },
          ]
          break
        case "uk":
          actions = [
            {
              id: 1,
              title: "Brexit Compliance Automation",
              description: "Implemented automated compliance checks for all UK-EU transactions",
              status: "completed",
              time: "3 days ago",
              impact: "100% regulatory compliance maintained",
              impactLevel: "low" as const,
            },
            {
              id: 2,
              title: "London Office Expansion",
              description: "Initiated recruitment for 8 new positions based on growth projections",
              status: "in_progress",
              time: "Ongoing",
              impact: "+15% capacity increase",
              impactLevel: "high" as const,
            },
            {
              id: 3,
              title: "UK Marketing Campaign",
              description: "Proposed £45,000 allocation for targeted digital marketing in financial services sector",
              status: "pending_approval",
              time: "Awaiting approval",
              impact: "+£120,000 projected revenue",
              impactLevel: "high" as const,
            },
          ]
          break
        case "germany":
          actions = [
            {
              id: 1,
              title: "Manufacturing Process Optimization",
              description: "Automated quality control process reducing defects by 28%",
              status: "completed",
              time: "5 days ago",
              impact: "-€85,000 in annual costs",
              impactLevel: "low" as const,
            },
            {
              id: 2,
              title: "Berlin Office Relocation",
              description: "Coordinating move to larger facility to accommodate team growth",
              status: "in_progress",
              time: "Ongoing",
              impact: "+40% office capacity",
              impactLevel: "high" as const,
            },
            {
              id: 3,
              title: "DACH Region Expansion",
              description: "Proposed market entry strategy for Austria and Switzerland",
              status: "pending_approval",
              time: "Awaiting approval",
              impact: "+€1.2M annual revenue opportunity",
              impactLevel: "high" as const,
            },
          ]
          break
        case "japan":
          actions = [
            {
              id: 1,
              title: "Supply Chain Optimization",
              description: "Renegotiated contracts with 3 key suppliers reducing costs by 12%",
              status: "completed",
              time: "1 week ago",
              impact: "-¥28M in annual costs",
              impactLevel: "high" as const,
            },
            {
              id: 2,
              title: "Tokyo Office Automation",
              description: "Implementing AI-powered customer service system",
              status: "in_progress",
              time: "Ongoing",
              impact: "+35% customer service efficiency",
              impactLevel: "low" as const,
            },
            {
              id: 3,
              title: "APAC Expansion Strategy",
              description: "Proposed entry into South Korean market with localized product offering",
              status: "pending_approval",
              time: "Awaiting approval",
              impact: "+¥180M revenue opportunity",
              impactLevel: "high" as const,
            },
          ]
          break
      }
    }

    return actions
  }

  const [automatedActions, setAutomatedActions] = useState(getSubsidiaryActions())
  const [activeTab, setActiveTab] = useState("all")

  // Update automatedActions when subsidiary changes
  useEffect(() => {
    setAutomatedActions(getSubsidiaryActions())
  }, [subsidiary])

  useEffect(() => {
    if (highlightItem === "inventory-optimization") {
      // Scroll to the relevant element and highlight it
      setTimeout(() => {
        const element = document.getElementById("inventory-optimization-action")
        if (element) {
          // Scroll with better centering
          element.scrollIntoView({
            behavior: "smooth",
            block: "center", // This centers the element in the viewport
          })

          // Start with no highlight
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

  const handleApproveAction = (id: number) => {
    setAutomatedActions((prev) =>
      prev.map((action) => (action.id === id ? { ...action, status: "in_progress" } : action)),
    )
  }

  const filteredActions =
    activeTab === "all" ? automatedActions : automatedActions.filter((action) => action.impactLevel === activeTab)

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Execution Dashboard</h2>
          <p className="text-sm text-muted-foreground">Human-guided and AI-automated business optimizations</p>
        </div>
        <Button size="sm" className="bg-zamora-purple hover:bg-zamora-purple-dark">
          <Plus className="h-4 w-4 mr-1" /> New Action
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="all" className="data-[state=active]:bg-zamora-purple data-[state=active]:text-white">
            All Actions
          </TabsTrigger>
          <TabsTrigger value="high" className="data-[state=active]:bg-zamora-purple data-[state=active]:text-white">
            Human-Guided
          </TabsTrigger>
          <TabsTrigger value="low" className="data-[state=active]:bg-zamora-purple data-[state=active]:text-white">
            AI-Automated
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Executed Insights</CardTitle>
          <CardDescription>Recent business optimizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {filteredActions.map((action) => (
              <div
                id="inventory-optimization-action"
                key={action.id}
                className="py-4 first:pt-0 last:pb-0 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <h4 className="text-sm font-medium">{action.title}</h4>
                      <Badge
                        className={`ml-2 ${
                          action.status === "completed"
                            ? "bg-green-500/20 text-green-500 border-green-500/50"
                            : action.status === "in_progress"
                              ? "bg-blue-500/20 text-blue-500 border-blue-500/50"
                              : "bg-amber-500/20 text-amber-500 border-amber-500/50"
                        }`}
                      >
                        {action.status === "completed"
                          ? "Completed"
                          : action.status === "in_progress"
                            ? "In Progress"
                            : "Pending Approval"}
                      </Badge>
                      <Badge
                        className={`ml-2 ${
                          action.impactLevel === "high"
                            ? "bg-purple-500/20 text-purple-500 border-purple-500/50"
                            : "bg-teal-500/20 text-teal-500 border-teal-500/50"
                        }`}
                      >
                        {action.impactLevel === "high" ? (
                          <div className="flex items-center">
                            <Shield className="h-3 w-3 mr-1" />
                            <span>Human-Guided</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Zap className="h-3 w-3 mr-1" />
                            <span>AI-Automated</span>
                          </div>
                        )}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{action.description}</div>
                    <div className="flex items-center mt-2">
                      <span className="text-xs text-muted-foreground">{action.time}</span>
                      <span className="mx-2 text-muted-foreground">•</span>
                      <span className="text-xs text-teal-500">{action.impact}</span>
                    </div>
                    {action.status === "completed" && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium text-green-500">Completed steps:</span>
                        <ol className="list-decimal ml-4 mt-1 space-y-1">
                          {action.id === 1 ? (
                            <>
                              <li>Identified high-risk customers using predictive churn model</li>
                              <li>Generated personalized retention offers based on purchase history</li>
                              <li>Deployed automated email campaign with 68% open rate</li>
                              <li>Monitored customer response and adjusted messaging</li>
                              <li>Achieved 82% retention of at-risk customers</li>
                            </>
                          ) : action.id === 4 ? (
                            <>
                              <li>Analyzed user engagement patterns across time zones</li>
                              <li>Developed algorithm to determine optimal send times</li>
                              <li>Implemented A/B testing to validate effectiveness</li>
                              <li>Deployed automated timing system</li>
                              <li>Achieved 18% increase in open rates</li>
                            </>
                          ) : action.id === 5 ? (
                            <>
                              <li>Trained AI model on historical support ticket data</li>
                              <li>Implemented automated categorization system</li>
                              <li>Integrated with support team workflow</li>
                              <li>Monitored accuracy and made adjustments</li>
                              <li>Reduced response time by 32%</li>
                            </>
                          ) : (
                            <>
                              <li>Analyzed historical data and identified patterns</li>
                              <li>Implemented recommended changes</li>
                              <li>Monitored results and made adjustments</li>
                              <li>Documented outcomes and learnings</li>
                              <li>Achieved target metrics</li>
                            </>
                          )}
                        </ol>
                      </div>
                    )}
                    {action.status === "in_progress" && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium text-blue-500">Progress:</span>
                        <ol className="list-decimal ml-4 mt-1 space-y-1">
                          {action.id === 2 ? (
                            <>
                              <li className="text-green-500">✓ Analyzed seasonal demand patterns (Completed)</li>
                              <li className="text-green-500">✓ Calculated optimal inventory levels (Completed)</li>
                              <li className="text-blue-500">→ Adjusting warehouse allocations (65% complete)</li>
                              <li className="text-slate-400">Updating supplier orders (Pending)</li>
                              <li className="text-slate-400">Final verification and reporting (Pending)</li>
                            </>
                          ) : (
                            <>
                              <li className="text-green-500">✓ Initial analysis completed (100%)</li>
                              <li className="text-green-500">✓ Strategy development completed (100%)</li>
                              <li className="text-blue-500">→ Implementation in progress (68% complete)</li>
                              <li className="text-slate-400">Verification and testing (Pending)</li>
                              <li className="text-slate-400">Final deployment and reporting (Pending)</li>
                            </>
                          )}
                        </ol>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>65%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: "65%" }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    {action.status === "pending_approval" && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium text-amber-500">Proposed steps:</span>
                        <ol className="list-decimal ml-4 mt-1 space-y-1">
                          <li>
                            Reduce{" "}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a href="/campaigns/isv-aware" className="text-blue-400 hover:underline">
                                    ISV Aware Campaign
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent className="w-80 p-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium">ISV Aware Campaign</h4>
                                    <p className="text-sm">Q3 2023 campaign targeting independent software vendors</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <span className="font-medium">Budget:</span> $15,000
                                      </div>
                                      <div>
                                        <span className="font-medium">ROI:</span> 0.8x
                                      </div>
                                      <div>
                                        <span className="font-medium">Conversion:</span> 1.2%
                                      </div>
                                      <div>
                                        <span className="font-medium">Status:</span> Underperforming
                                      </div>
                                      <div className="col-span-2 mt-1">
                                        <span className="font-medium">Target Audience:</span> Small to mid-size software
                                        vendors
                                      </div>
                                      <div className="col-span-2">
                                        <span className="font-medium">Channel:</span> Digital ads, email marketing
                                      </div>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>{" "}
                            budget by $5,000 (currently at 0.8 ROI)
                          </li>
                          <li>
                            Allocate funds to{" "}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a href="/campaigns/high-roi" className="text-blue-400 hover:underline">
                                    High-ROI Enterprise Campaigns
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent className="w-80 p-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium">High-ROI Enterprise Campaigns</h4>
                                    <p className="text-sm">
                                      Targeted campaigns for enterprise clients with 250+ employees
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <span className="font-medium">Budget:</span> $25,000
                                      </div>
                                      <div>
                                        <span className="font-medium">ROI:</span> 3.2x
                                      </div>
                                      <div>
                                        <span className="font-medium">Conversion:</span> 4.8%
                                      </div>
                                      <div>
                                        <span className="font-medium">Status:</span> High performing
                                      </div>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>{" "}
                            (currently at 3.2 ROI)
                          </li>
                          <li>Implement A/B testing to optimize conversion rates</li>
                        </ol>
                      </div>
                    )}
                  </div>
                  {action.status === "pending_approval" && action.impactLevel === "high" && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-500"
                        onClick={() => handleApproveAction(action.id)}
                      >
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-500"
                      >
                        <X className="h-4 w-4 mr-1" /> Decline
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Launch Retention Campaign</h3>
                <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/50">
                  <Shield className="h-3 w-3 mr-1" />
                  <span>Human-Guided</span>
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Target 24 high-risk customers with personalized offers
              </p>
              <div className="flex items-center justify-between">
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">+$45,200 projected revenue</Badge>
                <Button size="sm" className="bg-zamora-purple hover:bg-zamora-purple-dark">
                  Implement
                </Button>
              </div>
            </div>

            <div className="p-4 bg-secondary rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Adjust Product Pricing</h3>
                <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/50">
                  <Shield className="h-3 w-3 mr-1" />
                  <span>Human-Guided</span>
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Implement 5-8% price increase on 5 identified products
              </p>
              <div className="flex items-center justify-between">
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">+$28,500 projected revenue</Badge>
                <Button size="sm" className="bg-zamora-purple hover:bg-zamora-purple-dark">
                  Implement
                </Button>
              </div>
            </div>

            <div className="p-4 bg-secondary rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Optimize Email Send Times</h3>
                <Badge className="bg-teal-500/20 text-teal-500 border-teal-500/50">
                  <Zap className="h-3 w-3 mr-1" />
                  <span>AI-Automated</span>
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Automatically adjust email delivery based on recipient engagement patterns
              </p>
              <div className="flex items-center justify-between">
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">+15% open rate</Badge>
                <Button size="sm" className="bg-zamora-purple hover:bg-zamora-purple-dark">
                  Implement
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

