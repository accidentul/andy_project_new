"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  Bell,
  Brain,
  Building2,
  ChevronDown,
  CircleUser,
  Database,
  Globe,
  LayoutDashboard,
  Menu,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Palette,
  LayoutGrid,
  Sliders,
  Users,
  Cloud,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import DashboardSection from "./sections/dashboard-section"
import { AIInsightsSection } from "./sections/ai-insights-section"
import { BusinessMetricsSection } from "./sections/business-metrics-section"
import { DataSourcesSection } from "./sections/data-sources-section"
import { AutomatedActionsSection } from "./sections/automated-actions-section"
import { MarketIntelligenceSection } from "./sections/market-intelligence-section"
import { SecuritySection } from "./sections/security-section"
import { SettingsSection } from "./sections/settings-section"
import { AskAndiButton } from "./components/ask-andi-button"
import { MobileNav } from "./components/mobile-nav"
import { CollapsibleSearch } from "./components/collapsible-search"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { WidgetsSection } from "./sections/widgets-section"
import { LayoutSection } from "./sections/layout-section"
import { ThemesSection } from "./sections/themes-section"
import { ConnectorsSection } from "./sections/connectors-section"
import { WidgetGallery, type WidgetType } from "./components/widget-gallery"
import { WidgetCustomizer } from "./components/widget-customizer"
import { PlatformCustomizer } from "./components/platform-customizer"
import DashboardContent from "./dashboard-content"
import { getAuthToken } from "@/lib/api"
import { useLogout } from "./components/logout-handler"

type NavSection =
  | "dashboard"
  | "ai-insights"
  | "business-metrics"
  | "data-sources"
  | "automated-actions"
  | "market-intelligence"
  | "security"
  | "settings"
  | "widgets"
  | "layout"
  | "themes"
  | "connectors"

type Subsidiary = {
  id: string
  name: string
  region: string
  employees: number
  revenue: string
  color: string
}

// Sample subsidiaries data
const subsidiaries: Subsidiary[] = [
  {
    id: "global",
    name: "Zamora Global",
    region: "Global Headquarters",
    employees: 12500,
    revenue: "$1.24B",
    color: "purple",
  },
  {
    id: "us",
    name: "Zamora US",
    region: "North America",
    employees: 4200,
    revenue: "$580M",
    color: "blue",
  },
  {
    id: "uk",
    name: "Zamora UK",
    region: "Europe",
    employees: 3800,
    revenue: "$420M",
    color: "teal",
  },
  {
    id: "germany",
    name: "Zamora Germany",
    region: "Europe",
    employees: 2100,
    revenue: "$310M",
    color: "green",
  },
  {
    id: "japan",
    name: "Zamora Japan",
    region: "Asia Pacific",
    employees: 2400,
    revenue: "$180M",
    color: "amber",
  },
]

function DashboardContentInner() {
  const router = useRouter()
  const handleLogout = useLogout()
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard")
  const [openDialog, setOpenDialog] = useState<string | null>(null)
  const [ssoSetup, setSsoSetup] = useState(false)
  const [showSsoOptions, setShowSsoOptions] = useState(false)
  const [activeNotification, setActiveNotification] = useState<string | null>(null)
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<Subsidiary>(subsidiaries[0])
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Add these state variables to the Dashboard component
  const [widgetSizes, setWidgetSizes] = useState<Record<string, "small" | "medium" | "large">>({})
  const [rearrangeMode, setRearrangeMode] = useState(false)

  // Add these state variables after the existing state declarations
  const [widgetGalleryOpen, setWidgetGalleryOpen] = useState(false)
  const [widgetCustomizerOpen, setWidgetCustomizerOpen] = useState(false)
  const [platformCustomizerOpen, setPlatformCustomizerOpen] = useState(false)
  const [selectedWidget, setSelectedWidget] = useState<WidgetType | null>(null)
  const [isRearranging, setIsRearranging] = useState(false)
  const [dashboardWidgets, setDashboardWidgets] = useState<
    Array<WidgetType & { id: string; size: "small" | "medium" | "large" }>
  >([])

  // Reference to the mobile nav sheet
  const mobileNavRef = useRef<HTMLButtonElement>(null)

  // Sample notifications data with specific content identifiers
  const notifications = [
    {
      id: 1,
      message: "Competitor price change detected: 12% reduction in premium segment",
      timestamp: "10 min ago",
      section: "market-intelligence" as NavSection,
      contentId: "competitor-price-change",
      read: false,
    },
    {
      id: 2,
      message: "AI detected potential churn risk for 5 enterprise customers",
      timestamp: "25 min ago",
      section: "ai-insights" as NavSection,
      contentId: "churn-risk-detection",
      read: false,
    },
    {
      id: 3,
      message: "Automated inventory optimization completed: 15 products adjusted",
      timestamp: "1 hour ago",
      section: "automated-actions" as NavSection,
      contentId: "inventory-optimization",
      read: true,
    },
    {
      id: 4,
      message: "Security scan completed: 2 minor vulnerabilities detected",
      timestamp: "3 hours ago",
      section: "security" as NavSection,
      contentId: "security-vulnerabilities",
      read: true,
    },
    {
      id: 5,
      message: "Revenue forecast updated: Q4 projections increased by 8%",
      timestamp: "Yesterday",
      section: "business-metrics" as NavSection,
      contentId: "revenue-forecast",
      read: true,
    },
  ]

  // Add these functions after the existing functions
  const handleAddWidget = (widget: WidgetType) => {
    setDashboardWidgets([
      ...dashboardWidgets,
      {
        ...widget,
        id: `${widget.id}-${Date.now()}`, // Ensure unique ID
      },
    ])
    setWidgetGalleryOpen(false)
  }

  const handleRemoveWidget = (widgetId: string) => {
    setDashboardWidgets(dashboardWidgets.filter((w) => w.id !== widgetId))
  }

  const handleCustomizeWidget = (widget: WidgetType) => {
    setSelectedWidget(widget)
    setWidgetCustomizerOpen(true)
  }

  const handleSaveWidget = (updatedWidget: WidgetType) => {
    setDashboardWidgets(dashboardWidgets.map((w) => (w.id === updatedWidget.id ? { ...w, ...updatedWidget } : w)))
  }

  const handleResizeWidget = (widgetId: string, size: "small" | "medium" | "large") => {
    setDashboardWidgets(dashboardWidgets.map((w) => (w.id === widgetId ? { ...w, size } : w)))
  }

  const toggleRearrangeMode = () => {
    setIsRearranging(!isRearranging)
  }

  // Add this function to handle widget removal
  // const handleRemoveWidget = (widgetId: string) => {
  //   console.log("Removing widget:", widgetId)
  //   // Logic to remove the widget would go here
  // }

  // // Add this function to handle widget customization
  // const handleCustomizeWidget = (widgetId: string) => {
  //   console.log("Customizing widget:", widgetId)
  //   // Logic to customize the widget would go here
  // }

  // // Add this function to handle widget resizing
  // const handleResizeWidget = (widgetId: string, size: "small" | "medium" | "large") => {
  //   console.log("Resizing widget:", widgetId, "to size:", size)
  //   setWidgetSizes((prev) => ({
  //     ...prev,
  //     [widgetId]: size,
  //   }))
  // }

  // // Add this function to toggle rearrange mode
  // const toggleRearrangeMode = () => {
  //   setRearrangeMode((prev) => !prev)
  // }

  // Function to render the active section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardSection subsidiary={selectedSubsidiary} />
      case "ai-insights":
        return <AIInsightsSection highlightItem={activeNotification} subsidiary={selectedSubsidiary} />
      case "business-metrics":
        return <BusinessMetricsSection highlightItem={activeNotification} subsidiary={selectedSubsidiary} />
      case "data-sources":
        return <DataSourcesSection />
      case "automated-actions":
        return <AutomatedActionsSection highlightItem={activeNotification} subsidiary={selectedSubsidiary} />
      case "market-intelligence":
        return <MarketIntelligenceSection highlightItem={activeNotification} subsidiary={selectedSubsidiary} />
      case "security":
        return <SecuritySection highlightItem={activeNotification} subsidiary={selectedSubsidiary} />
      case "settings":
        return <SettingsSection />
      case "widgets":
        return <WidgetsSection />
      case "layout":
        return <LayoutSection />
      case "themes":
        return <ThemesSection />
      case "connectors":
        return <ConnectorsSection />
      default:
        return <DashboardSection subsidiary={selectedSubsidiary} />
    }
  }

  const isMobile = useMobile()

  // Update the handleNavClick function to add a delay before collapsing
  const handleNavClick = (section: NavSection) => {
    setActiveSection(section)
    // Add a delay before collapsing the sidebar to prevent jitter
    setTimeout(() => {
      setSidebarExpanded(false)
    }, 300) // 300ms delay before collapsing
  }

  const handleSearchExpandChange = (expanded: boolean) => {
    setIsSearchExpanded(expanded)
  }

  // Update the page component to handle mobile navigation selection
  const handleMobileNavSelect = (section: string) => {
    setActiveSection(section as NavSection)
  }

  // Function to toggle mobile nav
  const toggleMobileNav = () => {
    // Find and click the actual sheet trigger
    const mobileNav = document.getElementById("mobile-nav-sheet")
    if (mobileNav) {
      mobileNav.click()
    }
  }

  return (
    <>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="purple-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d8b4fe" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="min-h-screen flex flex-col">
        {/* Emergency Logout Link - Always Visible at Top */}
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          background: 'red',
          padding: '10px',
          borderRadius: '5px'
        }}>
          <a href="/logout" style={{ color: 'white', fontWeight: 'bold', textDecoration: 'none' }}>
            CLICK HERE TO LOGOUT
          </a>
        </div>
        
        {/* Header */}
        <header
          className={`h-16 border-b border-zamora-dark-light flex items-center px-6 ${isMobile ? "fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm" : ""}`}
        >
          {/* Left section - andi logo (desktop only) or mobile menu button */}
          <div className={`flex items-center ${isMobile ? "w-1/3 justify-start" : "w-1/4"}`}>
            {isMobile ? (
              <Button variant="ghost" size="icon" className="relative" onClick={toggleMobileNav}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            ) : (
              <div className="flex items-center">
                <div className="inline-flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-400" />
                  <span className="text-lg font-semibold bg-gradient-to-r from-purple-300 via-purple-400 to-purple-600 bg-clip-text text-transparent">
                    andi
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Center section - search or logo on mobile */}
          <div
            className={`flex ${isMobile ? "w-1/3 justify-center" : "flex-1 justify-center"} transition-all duration-300`}
          >
            {isMobile ? (
              <div
                className={`flex items-center transition-all duration-300 ${isSearchExpanded ? "transform -translate-x-8" : ""}`}
              >
                <div className="inline-flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-400" />
                  <span className="text-lg font-semibold bg-gradient-to-r from-purple-300 via-purple-400 to-purple-600 bg-clip-text text-transparent">
                    andi
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative w-full max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="rounded-full bg-secondary h-9 w-full pl-8 text-sm focus:outline-none focus:ring-1 focus:ring-zamora-purple"
                />
              </div>
            )}
          </div>

          {/* Right section - subsidiary dropdown, notifications, user */}
          <div className={`flex items-center justify-end gap-2 ${isMobile ? "w-1/3" : "w-1/4"}`}>
            {/* Collapsible Search on Mobile */}
            {isMobile && <CollapsibleSearch onExpandChange={handleSearchExpandChange} />}

            {/* Subsidiary Selector Dropdown - Only on Desktop */}
            {!isMobile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={`border-${selectedSubsidiary.color}-500/30 text-${selectedSubsidiary.color}-500 hover:bg-${selectedSubsidiary.color}-500/10`}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    <span className="hidden md:inline">{selectedSubsidiary.name}</span>
                    <span className="md:hidden">Company</span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Select Company</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Parent company */}
                  <DropdownMenuItem
                    key={subsidiaries[0].id}
                    onClick={() => setSelectedSubsidiary(subsidiaries[0])}
                    className={`flex items-start cursor-pointer ${selectedSubsidiary.id === subsidiaries[0].id ? `bg-${subsidiaries[0].color}-500/10` : ""}`}
                  >
                    <div className="flex items-center w-full">
                      <div className={`w-2 h-2 rounded-full bg-${subsidiaries[0].color}-500 mr-2`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{subsidiaries[0].name}</p>
                        <div className="flex items-center justify-between w-full mt-0.5">
                          <span className="text-xs text-muted-foreground">{subsidiaries[0].region}</span>
                          <span className="text-xs font-medium">{subsidiaries[0].revenue}</span>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">Subsidiaries</div>

                  {/* Child companies */}
                  {subsidiaries.slice(1).map((subsidiary) => (
                    <DropdownMenuItem
                      key={subsidiary.id}
                      onClick={() => setSelectedSubsidiary(subsidiary)}
                      className={`flex items-start cursor-pointer pl-4 ${selectedSubsidiary.id === subsidiary.id ? `bg-${subsidiary.color}-500/10` : ""}`}
                    >
                      <div className="flex items-center w-full">
                        <div className={`w-2 h-2 rounded-full bg-${subsidiary.color}-500 mr-2`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{subsidiary.name}</p>
                          <div className="flex items-center justify-between w-full mt-0.5">
                            <span className="text-xs text-muted-foreground">{subsidiary.region}</span>
                            <span className="text-xs font-medium">{subsidiary.revenue}</span>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-zamora-purple animate-pulse"></span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  <Badge variant="outline" className="text-xs font-normal">
                    {notifications.filter((n) => !n.read).length} new
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex flex-col items-start p-3 cursor-pointer ${notification.read ? "opacity-70" : "bg-secondary/40"}`}
                      onClick={() => {
                        setActiveSection(notification.section)
                        setActiveNotification(notification.contentId)
                        // You could also update the notification to be marked as read here
                      }}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <div
                          className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${notification.read ? "bg-slate-400" : "bg-zamora-purple"}`}
                        ></div>
                        <div className="flex-1">
                          <p className="text-sm">{notification.message}</p>
                          <div className="flex items-center justify-between w-full mt-1">
                            <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                            <Badge variant="outline" className="text-xs">
                              {notification.section
                                .split("-")
                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(" ")}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View All Notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Simple HTML link for logout - guaranteed to work */}
            <a 
              href="/logout" 
              style={{
                padding: '8px 16px',
                background: '#ef4444',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
              onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </a>
            
            {/* Temporary direct logout button for testing */}
            <Button 
              variant="destructive" 
              size="default"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              onClick={() => {
                console.log('Direct logout clicked - starting logout process')
                // Direct logout implementation - no external dependencies
                try {
                  // Clear all auth data
                  localStorage.removeItem('andi_token')
                  localStorage.removeItem('andi_user')
                  sessionStorage.removeItem('fromLogin')
                  sessionStorage.clear()
                  
                  console.log('Auth data cleared, redirecting to login...')
                  
                  // Force redirect to login
                  window.location.href = '/login'
                } catch (error) {
                  console.error('Logout error:', error)
                  // Fallback - still try to redirect
                  window.location.href = '/login'
                }
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
            
            {!isMobile && (
              <div className="relative group">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full flex items-center justify-center group-hover:bg-secondary transition-colors bg-zamora-purple/20"
                    >
                      <span className="text-sm font-medium">JD</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setOpenDialog("profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile Information</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenDialog("settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>User Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/admin/users") }>
                      <Users className="mr-2 h-4 w-4" />
                      <span>Admin → Users</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/admin/connectors") }>
                      <Cloud className="mr-2 h-4 w-4" />
                      <span>Admin → Connectors</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setOpenDialog("logout")}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </header>

        {/* Profile Information Dialog */}
        <Dialog open={openDialog === "profile"} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Profile Information</DialogTitle>
              <DialogDescription>Your personal and account details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <CircleUser className="h-20 w-20 text-zamora-purple" />
                  <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-green-500 border-2 border-background"></div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-sm font-medium">Name:</div>
                <div className="col-span-3">John Doe</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-sm font-medium">Role:</div>
                <div className="col-span-3">Senior Data Analyst</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-sm font-medium">Department:</div>
                <div className="col-span-3">Business Intelligence</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-sm font-medium">Access Level:</div>
                <div className="col-span-3">
                  <Badge className="bg-zamora-purple">Administrator</Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-sm font-medium">Email:</div>
                <div className="col-span-3">john.doe@company.com</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-sm font-medium">Last Login:</div>
                <div className="col-span-3">Today, 09:42 AM</div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpenDialog(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Settings Dialog */}
        <Dialog open={openDialog === "settings"} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>User Settings</DialogTitle>
              <DialogDescription>Manage your account preferences</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Dark Mode</span>
                  <span className="text-xs text-muted-foreground">Toggle dark/light theme</span>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Notifications</span>
                  <span className="text-xs text-muted-foreground">Receive email notifications</span>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Two-Factor Authentication</span>
                  <span className="text-xs text-muted-foreground">Enhance account security</span>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Data Sharing</span>
                  <span className="text-xs text-muted-foreground">Share analytics with team</span>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">SSO Login</span>
                  <span className="text-xs text-muted-foreground">
                    {ssoSetup ? (
                      "Single Sign-On enabled"
                    ) : (
                      <>
                        <a
                          href="#"
                          className="text-zamora-purple hover:underline"
                          onClick={(e) => {
                            e.preventDefault()
                            setShowSsoOptions(true)
                          }}
                        >
                          Setup SSO
                        </a>
                      </>
                    )}
                  </span>
                </div>
                <Switch checked={ssoSetup} onCheckedChange={setSsoSetup} />
              </div>

              {showSsoOptions && (
                <div className="mt-2 p-3 bg-secondary/50 rounded-md">
                  <h4 className="text-sm font-medium mb-2">SSO Provider</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="sso-google"
                        name="sso-provider"
                        className="text-zamora-purple focus:ring-zamora-purple"
                        defaultChecked
                      />
                      <label htmlFor="sso-google" className="text-sm">
                        Google Workspace
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="sso-azure"
                        name="sso-provider"
                        className="text-zamora-purple focus:ring-zamora-purple"
                      />
                      <label htmlFor="sso-azure" className="text-sm">
                        Microsoft Azure AD
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="sso-okta"
                        name="sso-provider"
                        className="text-zamora-purple focus:ring-zamora-purple"
                      />
                      <label htmlFor="sso-okta" className="text-sm">
                        Okta
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="sso-custom"
                        name="sso-provider"
                        className="text-zamora-purple focus:ring-zamora-purple"
                      />
                      <label htmlFor="sso-custom" className="text-sm">
                        Custom SAML Provider
                      </label>
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button
                        size="sm"
                        className="bg-zamora-purple hover:bg-zamora-purple-dark"
                        onClick={() => {
                          setSsoSetup(true)
                          setShowSsoOptions(false)
                        }}
                      >
                        Save Provider
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(null)}>
                Cancel
              </Button>
              <Button onClick={() => setOpenDialog(null)}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Logout Confirmation Dialog */}
        <Dialog open={openDialog === "logout"} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Log Out</DialogTitle>
              <DialogDescription>Are you sure you want to log out of your account?</DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setOpenDialog(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  console.log('Dialog logout button clicked')
                  setOpenDialog(null)
                  // Direct logout - same as the red button
                  try {
                    localStorage.removeItem('andi_token')
                    localStorage.removeItem('andi_user')
                    sessionStorage.removeItem('fromLogin')
                    sessionStorage.clear()
                    console.log('Logged out, redirecting...')
                    window.location.href = '/login'
                  } catch (error) {
                    console.error('Logout error:', error)
                    window.location.href = '/login'
                  }
                }}
              >
                Log Out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex flex-1">
          {/* Mobile Sidebar */}
          <MobileNav
            onOpenDialog={setOpenDialog}
            subsidiaries={subsidiaries}
            selectedSubsidiary={selectedSubsidiary}
            setSelectedSubsidiary={setSelectedSubsidiary}
            onNavSelect={handleMobileNavSelect}
            activeSection={activeSection}
          />

          {/* Desktop Sidebar */}
          <aside
            className={
              "bg-gradient-to-b from-purple-900/80 via-purple-950/70 to-slate-900/60 flex flex-col rounded-r-2xl shadow-lg backdrop-blur-sm hidden md:flex overflow-y-auto w-[220px]"
            }
          >
            <div className="p-4 border-b border-purple-800/50">
              <div className={cn("flex items-center gap-2", sidebarExpanded ? "justify-start" : "justify-center")}>
                <Brain className="h-5 w-5 text-purple-400" />
                {sidebarExpanded && (
                  <div className="text-white overflow-hidden">
                    <div className="text-xs font-light tracking-wider whitespace-nowrap">ADAPTIVE NEURAL</div>
                    <div className="text-xs font-light tracking-wider whitespace-nowrap">DATA INTELLIGENCE</div>
                  </div>
                )}
              </div>
            </div>

            <nav className="flex-1 py-4 overflow-y-auto pr-1">
              <ul className="space-y-1 px-2">
                <li>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full text-white hover:bg-white/10 transition-all duration-500 ease-in-out",
                      activeSection === "dashboard" ? "bg-white/15 border-l-4 border-white" : "",
                      sidebarExpanded
                        ? "justify-start text-[10px] font-light tracking-wide pr-1"
                        : "justify-center px-0",
                    )}
                    onClick={() => handleNavClick("dashboard")}
                  >
                    <LayoutDashboard className={cn("h-3.5 w-3.5", sidebarExpanded ? "mr-2" : "")} />
                    {sidebarExpanded && <span>DASHBOARD</span>}
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full text-white hover:bg-white/10 transition-all duration-500 ease-in-out",
                      activeSection === "ai-insights" ? "bg-white/15 border-l-4 border-white" : "",
                      sidebarExpanded
                        ? "justify-start text-[10px] font-light tracking-wide pr-1"
                        : "justify-center px-0",
                    )}
                    onClick={() => handleNavClick("ai-insights")}
                  >
                    <Brain className={cn("h-3.5 w-3.5", sidebarExpanded ? "mr-2" : "")} />
                    {sidebarExpanded && <span>andi's INSIGHTS</span>}
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full text-white hover:bg-white/10 transition-all duration-500 ease-in-out",
                      activeSection === "business-metrics" ? "bg-white/15 border-l-4 border-white" : "",
                      sidebarExpanded
                        ? "justify-start text-[10px] font-light tracking-wide pr-1"
                        : "justify-center px-0",
                    )}
                    onClick={() => handleNavClick("business-metrics")}
                  >
                    <Activity className={cn("h-3.5 w-3.5", sidebarExpanded ? "mr-2" : "")} />
                    {sidebarExpanded && <span>BUSINESS METRICS</span>}
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full text-white hover:bg-white/10 transition-all duration-500 ease-in-out",
                      activeSection === "data-sources" ? "bg-white/15 border-l-4 border-white" : "",
                      sidebarExpanded
                        ? "justify-start text-[10px] font-light tracking-wide pr-1"
                        : "justify-center px-0",
                    )}
                    onClick={() => handleNavClick("data-sources")}
                  >
                    <Database className={cn("h-3.5 w-3.5", sidebarExpanded ? "mr-2" : "")} />
                    {sidebarExpanded && <span>DATA SOURCES</span>}
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full text-white hover:bg-white/10 transition-all duration-500 ease-in-out",
                      activeSection === "automated-actions" ? "bg-white/15 border-l-4 border-white" : "",
                      sidebarExpanded
                        ? "justify-start text-[10px] font-light tracking-wide pr-1"
                        : "justify-center px-0",
                    )}
                    onClick={() => handleNavClick("automated-actions")}
                  >
                    <Rocket className={cn("h-3.5 w-3.5", sidebarExpanded ? "mr-2" : "")} />
                    {sidebarExpanded && <span>EXECUTION DASHBOARD</span>}
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full text-white hover:bg-white/10 transition-all duration-500 ease-in-out",
                      activeSection === "market-intelligence" ? "bg-white/15 border-l-4 border-white" : "",
                      sidebarExpanded
                        ? "justify-start text-[10px] font-light tracking-wide pr-1"
                        : "justify-center px-0",
                    )}
                    onClick={() => handleNavClick("market-intelligence")}
                  >
                    <Globe className={cn("h-3.5 w-3.5", sidebarExpanded ? "mr-2" : "")} />
                    {sidebarExpanded && <span>MARKET INTELLIGENCE</span>}
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full text-white hover:bg-white/10 transition-all duration-500 ease-in-out",
                      activeSection === "connectors" ? "bg-white/15 border-l-4 border-white" : "",
                      sidebarExpanded
                        ? "justify-start text-[10px] font-light tracking-wide pr-1"
                        : "justify-center px-0",
                    )}
                    onClick={() => handleNavClick("connectors")}
                  >
                    <Cloud className={cn("h-3.5 w-3.5", sidebarExpanded ? "mr-2" : "")} />
                    {sidebarExpanded && <span>CONNECTORS</span>}
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full text-white hover:bg-white/10 transition-all duration-500 ease-in-out",
                      activeSection === "security" ? "bg-white/15 border-l-4 border-white" : "",
                      sidebarExpanded
                        ? "justify-start text-[10px] font-light tracking-wide pr-1"
                        : "justify-center px-0",
                    )}
                    onClick={() => handleNavClick("security")}
                  >
                    <ShieldCheck className={cn("h-3.5 w-3.5", sidebarExpanded ? "mr-2" : "")} />
                    {sidebarExpanded && <span>SECURITY & PRIVACY</span>}
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full text-white hover:bg-white/10 transition-all duration-500 ease-in-out",
                      activeSection === "settings" ? "bg-white/15 border-l-4 border-white" : "",
                      sidebarExpanded
                        ? "justify-start text-[10px] font-light tracking-wide pr-1"
                        : "justify-center px-0",
                    )}
                    onClick={() => handleNavClick("settings")}
                  >
                    <Settings className={cn("h-3.5 w-3.5", sidebarExpanded ? "mr-2" : "")} />
                    {sidebarExpanded && <span>SETTINGS</span>}
                  </Button>
                </li>
                {/* Admin shortcuts inline so they are always visible */}
                <li>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full text-white hover:bg-white/10 transition-all duration-500 ease-in-out",
                      sidebarExpanded ? "justify-start text-[10px] font-light tracking-wide pr-1" : "justify-center px-0",
                    )}
                    onClick={() => router.push("/admin/users")}
                  >
                    <Users className={cn("h-3.5 w-3.5", sidebarExpanded ? "mr-2" : "")} />
                    {sidebarExpanded && <span>ADMIN USERS</span>}
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full text-white hover:bg-white/10 transition-all duration-500 ease-in-out",
                      sidebarExpanded ? "justify-start text-[10px] font-light tracking-wide pr-1" : "justify-center px-0",
                    )}
                    onClick={() => router.push("/admin/connectors")}
                  >
                    <Cloud className={cn("h-3.5 w-3.5", sidebarExpanded ? "mr-2" : "")} />
                    {sidebarExpanded && <span>ADMIN CONNECTORS</span>}
                  </Button>
                </li>
              </ul>
              {/* Admin group (moved above customization for visibility) */}
              <div className="px-2 mt-2">
                <div className="h-px bg-white/20 my-2"></div>
                <p className={cn("text-[10px] font-light text-white/50 px-2 py-1", !sidebarExpanded && "hidden")}>
                  ADMIN
                </p>
                <ul className="space-y-1 mt-1">
                  <li>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full text-white hover:bg-white/10 transition-all duration-500 ease-in-out",
                        sidebarExpanded ? "justify-start text-[10px] font-light tracking-wide pr-1" : "justify-center px-0",
                      )}
                      onClick={() => router.push("/admin/users")}
                    >
                      <Users className={cn("h-3.5 w-3.5", sidebarExpanded ? "mr-2" : "")} />
                      {sidebarExpanded ? <span>USERS</span> : null}
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full text-white hover:bg-white/10 transition-all duration-500 ease-in-out",
                        sidebarExpanded ? "justify-start text-[10px] font-light tracking-wide pr-1" : "justify-center px-0",
                      )}
                      onClick={() => router.push("/admin/connectors")}
                    >
                      <Cloud className={cn("h-3.5 w-3.5", sidebarExpanded ? "mr-2" : "")} />
                      {sidebarExpanded ? <span>CONNECTORS</span> : null}
                    </Button>
                  </li>
                </ul>
              </div>

              <div className="px-2 mt-4">
                <div className="h-px bg-white/20 my-2"></div>
                <p className={cn("text-[10px] font-light text-white/50 px-2 py-1", !sidebarExpanded && "hidden")}>
                  CUSTOMIZATION
                </p>
                <ul className={cn("space-y-1 mt-1", isMobile && "hidden")}>
                  <li>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full text-white hover:bg-white/10 transition-all duration-500 ease-in-out",
                        sidebarExpanded
                          ? "justify-start text-[10px] font-light tracking-wide pr-1"
                          : "justify-center px-0",
                      )}
                      onClick={() => setWidgetGalleryOpen(true)}
                    >
                      <LayoutGrid className={cn("h-3.5 w-3.5", sidebarExpanded ? "mr-2" : "")} />
                      {sidebarExpanded && <span>CUSTOMIZE</span>}
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full text-white hover:bg-white/10 transition-all duration-500 ease-in-out",
                        sidebarExpanded
                          ? "justify-start text-[10px] font-light tracking-wide pr-1"
                          : "justify-center px-0",
                      )}
                      onClick={() => setPlatformCustomizerOpen(true)}
                    >
                      <Palette className={cn("h-3.5 w-3.5", sidebarExpanded ? "mr-2" : "")} />
                      {sidebarExpanded && <span>APPEARANCE</span>}
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full text-white hover:bg-white/10 transition-all duration-500 ease-in-out",
                        sidebarExpanded
                          ? "justify-start text-[10px] font-light tracking-wide pr-1"
                          : "justify-center px-0",
                      )}
                      onClick={toggleRearrangeMode}
                    >
                      <Sliders className={cn("h-3.5 w-3.5", sidebarExpanded ? "mr-2" : "")} />
                      {sidebarExpanded && <span>LAYOUT</span>}
                    </Button>
                  </li>
                </ul>
              </div>

            </nav>
          </aside>

          {/* Main Content */}
          <main className={`flex-1 p-6 overflow-auto ${isMobile ? "pt-20" : ""}`}>
            {activeSection === "dashboard" && (
              <h1 className="text-2xl font-semibold tracking-tight mb-6">{`${selectedSubsidiary.name} Dashboard`}</h1>
            )}
            {renderSectionContent()}
          </main>
        </div>

        {/* Ask ANDI Button */}
        <AskAndiButton />

        {/* Widget Gallery Dialog */}
        <WidgetGallery open={widgetGalleryOpen} onOpenChange={setWidgetGalleryOpen} onAddWidget={handleAddWidget} />

        {/* Widget Customizer Dialog */}
        <WidgetCustomizer
          open={widgetCustomizerOpen}
          onOpenChange={setWidgetCustomizerOpen}
          widget={selectedWidget}
          onSave={handleSaveWidget}
        />

        {/* Platform Customizer Dialog */}
        <PlatformCustomizer
          open={platformCustomizerOpen}
          onOpenChange={setPlatformCustomizerOpen}
          onSave={() => {
            // In a real app, you would apply the saved settings
            setPlatformCustomizerOpen(false)
          }}
        />

        {/* Rearrange Mode Indicator */}
        {isRearranging && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full z-50 flex items-center gap-2">
            <span>Move Widget Mode Active</span>
            <Button size="sm" variant="outline" onClick={toggleRearrangeMode}>
              Done
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  

  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken()
      const fromLogin = sessionStorage.getItem("fromLogin")
      if (token || fromLogin === "true") {
        setIsAuthenticated(true)
        setIsLoading(false)
      } else {
        router.push("/login")
      }
    }
    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <DashboardContent />
}

