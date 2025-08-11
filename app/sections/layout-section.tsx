"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Grid, LayoutGrid, Rows, Columns, Save } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function LayoutSection() {
  const [activeLayout, setActiveLayout] = useState("default")
  const [editMode, setEditMode] = useState(false)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  const layouts = [
    {
      id: "default",
      name: "Default Layout",
      description: "Standard dashboard layout with balanced widget sizes",
      icon: <LayoutGrid className="h-5 w-5" />,
    },
    {
      id: "compact",
      name: "Compact Layout",
      description: "More widgets in a condensed view for data-dense dashboards",
      icon: <Grid className="h-5 w-5" />,
    },
    {
      id: "focus",
      name: "Focus Layout",
      description: "Emphasizes key metrics with larger widgets and fewer distractions",
      icon: <Rows className="h-5 w-5" />,
    },
    {
      id: "comparison",
      name: "Comparison Layout",
      description: "Side-by-side layout optimized for comparing metrics",
      icon: <Columns className="h-5 w-5" />,
    },
  ]

  const handleSaveLayout = () => {
    setEditMode(false)
    // Logic to save the layout configuration
    console.log("Saving layout:", activeLayout)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Layout Customization</h1>
          <p className="text-muted-foreground">Organize your dashboard layout</p>
        </div>
        {editMode ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditMode(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLayout} className="bg-zamora-purple hover:bg-zamora-purple-dark">
              <Save className="mr-2 h-4 w-4" /> Save Layout
            </Button>
          </div>
        ) : (
          <Button onClick={() => setEditMode(true)} className="bg-zamora-purple hover:bg-zamora-purple-dark">
            Edit Layout
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Layout Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Choose a predefined layout template or customize your own.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {layouts.map((layout) => (
              <Card
                key={layout.id}
                className={`cursor-pointer transition-all ${
                  activeLayout === layout.id ? "border-2 border-zamora-purple" : "hover:border-zamora-purple/50"
                }`}
                onClick={() => setActiveLayout(layout.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {layout.icon}
                      <span className="ml-2 font-medium">{layout.name}</span>
                    </div>
                    {activeLayout === layout.id && (
                      <div className="h-5 w-5 rounded-full bg-zamora-purple flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{layout.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Dashboard Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Configure the sections of your dashboard and how widgets are arranged within them.
          </p>

          <Tabs defaultValue="top" className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="top" onClick={() => setSelectedSection("top")}>
                Top Section
              </TabsTrigger>
              <TabsTrigger value="middle" onClick={() => setSelectedSection("middle")}>
                Middle Section
              </TabsTrigger>
              <TabsTrigger value="bottom" onClick={() => setSelectedSection("bottom")}>
                Bottom Section
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Section Layout</h3>
                <p className="text-xs text-muted-foreground">Choose how widgets are arranged in this section</p>
              </div>
              <select className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="grid">Grid (Default)</option>
                <option value="columns">Equal Columns</option>
                <option value="featured">Featured + Sidebar</option>
                <option value="stacked">Stacked</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Widget Spacing</h3>
                <p className="text-xs text-muted-foreground">Adjust the space between widgets</p>
              </div>
              <select className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="normal">Normal (Default)</option>
                <option value="compact">Compact</option>
                <option value="spacious">Spacious</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Widget Alignment</h3>
                <p className="text-xs text-muted-foreground">Set how widgets align within their containers</p>
              </div>
              <select className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="stretch">Stretch (Default)</option>
                <option value="start">Top/Left</option>
                <option value="center">Center</option>
                <option value="end">Bottom/Right</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Section Visibility</h3>
                <p className="text-xs text-muted-foreground">Control whether this section is visible</p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="section-visible"
                  className="h-4 w-4 rounded border-gray-300 text-zamora-purple focus:ring-zamora-purple"
                  defaultChecked
                />
                <label htmlFor="section-visible" className="text-sm">
                  Visible
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-medium mb-3">Section Preview</h3>
            <div className="bg-secondary/50 rounded-lg p-4 h-[200px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <LayoutGrid className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Preview of selected layout will appear here</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Auto-arrange Widgets</h3>
                <p className="text-xs text-muted-foreground">Automatically organize widgets based on usage patterns</p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto-arrange"
                  className="h-4 w-4 rounded border-gray-300 text-zamora-purple focus:ring-zamora-purple"
                />
                <label htmlFor="auto-arrange" className="text-sm">
                  Enable
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Responsive Behavior</h3>
                <p className="text-xs text-muted-foreground">How widgets adapt to different screen sizes</p>
              </div>
              <select className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="adaptive">Adaptive (Default)</option>
                <option value="stack">Stack on Mobile</option>
                <option value="hide">Hide Non-Essential</option>
                <option value="scroll">Horizontal Scroll</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Animation Effects</h3>
                <p className="text-xs text-muted-foreground">Visual effects when loading widgets</p>
              </div>
              <select className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="subtle">Subtle (Default)</option>
                <option value="none">None</option>
                <option value="fade">Fade In</option>
                <option value="slide">Slide In</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

