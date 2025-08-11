"use client"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"

interface PlatformCustomizerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function PlatformCustomizer({ open, onOpenChange, onSave }: PlatformCustomizerProps) {
  const [theme, setTheme] = useState("system")
  const [density, setDensity] = useState("comfortable")
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [fontScale, setFontScale] = useState([100])
  const [colorScheme, setColorScheme] = useState("purple")

  const handleSave = () => {
    // In a real app, you would save these settings
    onSave()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Platform Customization</DialogTitle>
          <DialogDescription>Customize the appearance and behavior of the platform</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="appearance">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-4 pt-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="theme" className="text-right">
                Theme
              </Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="col-span-3" id="theme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color-scheme" className="text-right">
                Color Scheme
              </Label>
              <RadioGroup value={colorScheme} onValueChange={setColorScheme} className="col-span-3 flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="purple" id="purple" className="bg-purple-500" />
                  <Label htmlFor="purple">Purple</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="blue" id="blue" className="bg-blue-500" />
                  <Label htmlFor="blue">Blue</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="teal" id="teal" className="bg-teal-500" />
                  <Label htmlFor="teal">Teal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="amber" id="amber" className="bg-amber-500" />
                  <Label htmlFor="amber">Amber</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="font-scale" className="text-right">
                Font Size
              </Label>
              <div className="col-span-3">
                <Slider
                  id="font-scale"
                  min={75}
                  max={150}
                  step={5}
                  value={fontScale}
                  onValueChange={setFontScale}
                  className="w-full"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">Smaller</span>
                  <span className="text-xs text-muted-foreground">{fontScale}%</span>
                  <span className="text-xs text-muted-foreground">Larger</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="animations" className="text-right">
                Animations
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch id="animations" checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
                <Label htmlFor="animations">{animationsEnabled ? "Enabled" : "Disabled"}</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4 pt-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="density" className="text-right">
                Layout Density
              </Label>
              <Select value={density} onValueChange={setDensity}>
                <SelectTrigger className="col-span-3" id="density">
                  <SelectValue placeholder="Select density" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sidebar-position" className="text-right">
                Sidebar Position
              </Label>
              <RadioGroup defaultValue="left" className="col-span-3 flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="left" id="left" />
                  <Label htmlFor="left">Left</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="right" id="right" />
                  <Label htmlFor="right">Right</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="default-view" className="text-right">
                Default View
              </Label>
              <Select defaultValue="dashboard">
                <SelectTrigger className="col-span-3" id="default-view">
                  <SelectValue placeholder="Select default view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="ai-insights">AI Insights</SelectItem>
                  <SelectItem value="business-metrics">Business Metrics</SelectItem>
                  <SelectItem value="data-sources">Data Sources</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4 pt-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="auto-refresh" className="text-right">
                Auto-Refresh
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch id="auto-refresh" defaultChecked />
                <Label htmlFor="auto-refresh">Enable automatic data refresh</Label>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notifications" className="text-right">
                Notifications
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch id="notifications" defaultChecked />
                <Label htmlFor="notifications">Show in-app notifications</Label>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ai-suggestions" className="text-right">
                AI Suggestions
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch id="ai-suggestions" defaultChecked />
                <Label htmlFor="ai-suggestions">Show AI-powered suggestions</Label>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

