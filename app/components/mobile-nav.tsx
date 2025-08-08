"use client"

import { useState } from "react"
import {
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Brain,
  LayoutDashboard,
  Activity,
  Database,
  Rocket,
  Globe,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useMobile } from "@/hooks/use-mobile"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MobileNavProps {
  className?: string
  onOpenDialog?: (dialog: string) => void
  subsidiaries: any[]
  selectedSubsidiary: any
  setSelectedSubsidiary: (subsidiary: any) => void
  onNavSelect?: (section: string) => void
  activeSection: string
}

export function MobileNav({
  className,
  onOpenDialog,
  subsidiaries,
  selectedSubsidiary,
  setSelectedSubsidiary,
  onNavSelect,
  activeSection,
}: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const isMobile = useMobile()

  const handleNavClick = (section: string) => {
    if (onNavSelect) {
      onNavSelect(section)
    }
    setOpen(false) // Close the sheet when a nav item is selected
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          id="mobile-nav-sheet"
          variant="ghost"
          size="icon"
          className="md:hidden fixed top-4 left-4 z-40 bg-background/80 backdrop-blur-sm opacity-0 pointer-events-none"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 w-[220px] bg-gradient-to-b from-purple-900/80 via-purple-950/70 to-slate-900/60 flex flex-col"
      >
        <div className="flex-grow overflow-auto">
          <aside className="w-full flex flex-col h-full">
            <div className="p-4 border-b border-purple-800/50">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                <span className="text-lg font-bold bg-gradient-to-r from-purple-300 to-indigo-400 bg-clip-text text-transparent">
                  andi
                </span>
                <div className="text-white">
                  <div className="text-xs font-light tracking-wider">ADAPTIVE NEURAL</div>
                  <div className="text-xs font-light tracking-wider">DATA INTELLIGENCE</div>
                </div>
              </div>
            </div>

            <nav className="flex-1 py-4">
              <ul className="space-y-1 px-2">
                <li>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-white hover:bg-white/10 ${activeSection === "dashboard" ? "bg-white/15 border-l-4 border-white" : ""} text-[10px] font-light tracking-wide`}
                    onClick={() => handleNavClick("dashboard")}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 mr-2" />
                    DASHBOARD
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-white hover:bg-white/10 ${activeSection === "ai-insights" ? "bg-white/15 border-l-4 border-white" : ""} text-[10px] font-light tracking-wide`}
                    onClick={() => handleNavClick("ai-insights")}
                  >
                    <Brain className="h-3.5 w-3.5 mr-2" />
                    AI INSIGHTS
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-white hover:bg-white/10 ${activeSection === "business-metrics" ? "bg-white/15 border-l-4 border-white" : ""} text-[10px] font-light tracking-wide`}
                    onClick={() => handleNavClick("business-metrics")}
                  >
                    <Activity className="h-3.5 w-3.5 mr-2" />
                    BUSINESS METRICS
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-white hover:bg-white/10 ${activeSection === "data-sources" ? "bg-white/15 border-l-4 border-white" : ""} text-[10px] font-light tracking-wide`}
                    onClick={() => handleNavClick("data-sources")}
                  >
                    <Database className="h-3.5 w-3.5 mr-2" />
                    DATA SOURCES
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-white hover:bg-white/10 ${activeSection === "automated-actions" ? "bg-white/15 border-l-4 border-white" : ""} text-[10px] font-light tracking-wide`}
                    onClick={() => handleNavClick("automated-actions")}
                  >
                    <Rocket className="h-3.5 w-3.5 mr-2" />
                    EXECUTION DASHBOARD
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-white hover:bg-white/10 ${activeSection === "market-intelligence" ? "bg-white/15 border-l-4 border-white" : ""} text-[10px] font-light tracking-wide`}
                    onClick={() => handleNavClick("market-intelligence")}
                  >
                    <Globe className="h-3.5 w-3.5 mr-2" />
                    MARKET INTELLIGENCE
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-white hover:bg-white/10 ${activeSection === "security" ? "bg-white/15 border-l-4 border-white" : ""} text-[10px] font-light tracking-wide`}
                    onClick={() => handleNavClick("security")}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                    SECURITY & PRIVACY
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-white hover:bg-white/10 ${activeSection === "settings" ? "bg-white/15 border-l-4 border-white" : ""} text-[10px] font-light tracking-wide`}
                    onClick={() => handleNavClick("settings")}
                  >
                    <Settings className="h-3.5 w-3.5 mr-2" />
                    SETTINGS
                  </Button>
                </li>
              </ul>

              {/* Add this section to the MobileNav component's navigation items */}
              {/* This should be added after the existing navigation items */}

              {/* Remove or comment out any customization options in the mobile nav */}
              {/*
              <div className="px-4 py-2">
                <div className="h-px bg-slate-700 my-2"></div>
                <div className="text-xs font-light tracking-wide text-slate-400 px-2 py-1">CUSTOMIZE</div>
              </div>
              <div className="px-4 py-2 space-y-1">
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-slate-300 hover:bg-slate-800 ${
                    activeSection === "widgets" ? "bg-slate-800 text-white" : ""
                  }`}
                  onClick={() => onNavSelect("widgets")}
                >
                  <div className="h-4 w-4 mr-3 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  Widgets
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-slate-300 hover:bg-slate-800 ${
                    activeSection === "layout" ? "bg-slate-800 text-white" : ""
                  }`}
                  onClick={() => onNavSelect("layout")}
                >
                  <div className="h-4 w-4 mr-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                      <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="2" />
                      <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  Layout
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-slate-300 hover:bg-slate-800 ${
                    activeSection === "themes" ? "bg-slate-800 text-white" : ""
                  }`}
                  onClick={() => onNavSelect("themes")}
                >
                  <div className="h-4 w-4 mr-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 3V21" stroke="currentColor" strokeWidth="2" />
                      <path d="M3 12H21" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  Themes
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-slate-300 hover:bg-slate-800 ${
                    activeSection === "connectors" ? "bg-slate-800 text-white" : ""
                  }`}
                  onClick={() => onNavSelect("connectors")}
                >
                  <div className="h-4 w-4 mr-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="2" />
                      <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  Connectors
                </Button>
              </div>
              */}
            </nav>
          </aside>
        </div>

        {/* Subsidiary Selector in Mobile Nav */}
        <div className="p-4 border-t border-white/10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full bg-${selectedSubsidiary.color}-500 mr-2`}></div>
                  <span className="text-sm">{selectedSubsidiary.name}</span>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </div>
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
        </div>

        {isMobile && (
          <div className="p-4 border-t border-white/10 mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-zamora-purple/20 flex items-center justify-center mr-2">
                      <span className="text-sm font-medium text-white">JD</span>
                    </div>
                    <span>Profile</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onOpenDialog && onOpenDialog("profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile Information</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenDialog && onOpenDialog("settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>User Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onOpenDialog && onOpenDialog("logout")}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// Add the Trigger property to MobileNav
MobileNav.Trigger = function MobileNavTrigger({ onClick }: { onClick?: () => void }) {
  return (
    <Button variant="ghost" size="icon" className="relative" onClick={onClick}>
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle menu</span>
    </Button>
  )
}

