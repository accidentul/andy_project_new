"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Moon, Paintbrush, Sun } from "lucide-react"

interface ColorScheme {
  id: string
  name: string
  primary: string
  secondary: string
  accent: string
  background: string
  preview: React.ReactNode
}

export function ThemesSection() {
  const [activeTheme, setActiveTheme] = useState("dark")
  const [activeColorScheme, setActiveColorScheme] = useState("purple")
  const [customizing, setCustomizing] = useState(false)

  const themes = [
    {
      id: "dark",
      name: "Dark Theme",
      icon: <Moon className="h-5 w-5" />,
      description: "Dark background with light text for reduced eye strain",
    },
    {
      id: "light",
      name: "Light Theme",
      icon: <Sun className="h-5 w-5" />,
      description: "Light background with dark text for high contrast",
    },
    {
      id: "system",
      name: "System Theme",
      icon: <Paintbrush className="h-5 w-5" />,
      description: "Automatically match your system's theme preference",
    },
  ]

  const colorSchemes: ColorScheme[] = [
    {
      id: "purple",
      name: "Purple (Default)",
      primary: "#c084fc",
      secondary: "#a855f7",
      accent: "#9333ea",
      background: "#1e1b4b",
      preview: (
        <div className="h-full w-full rounded-md overflow-hidden">
          <div className="h-1/2 bg-gradient-to-r from-purple-400 to-purple-600"></div>
          <div className="h-1/2 bg-gradient-to-r from-slate-800 to-slate-900"></div>
        </div>
      ),
    },
    {
      id: "blue",
      name: "Ocean Blue",
      primary: "#60a5fa",
      secondary: "#3b82f6",
      accent: "#2563eb",
      background: "#172554",
      preview: (
        <div className="h-full w-full rounded-md overflow-hidden">
          <div className="h-1/2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
          <div className="h-1/2 bg-gradient-to-r from-slate-800 to-slate-900"></div>
        </div>
      ),
    },
    {
      id: "teal",
      name: "Teal Accent",
      primary: "#5eead4",
      secondary: "#2dd4bf",
      accent: "#14b8a6",
      background: "#134e4a",
      preview: (
        <div className="h-full w-full rounded-md overflow-hidden">
          <div className="h-1/2 bg-gradient-to-r from-teal-400 to-teal-600"></div>
          <div className="h-1/2 bg-gradient-to-r from-slate-800 to-slate-900"></div>
        </div>
      ),
    },
    {
      id: "amber",
      name: "Amber Glow",
      primary: "#fcd34d",
      secondary: "#f59e0b",
      accent: "#d97706",
      background: "#78350f",
      preview: (
        <div className="h-full w-full rounded-md overflow-hidden">
          <div className="h-1/2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
          <div className="h-1/2 bg-gradient-to-r from-slate-800 to-slate-900"></div>
        </div>
      ),
    },
    {
      id: "green",
      name: "Emerald Green",
      primary: "#6ee7b7",
      secondary: "#10b981",
      accent: "#059669",
      background: "#064e3b",
      preview: (
        <div className="h-full w-full rounded-md overflow-hidden">
          <div className="h-1/2 bg-gradient-to-r from-green-400 to-green-600"></div>
          <div className="h-1/2 bg-gradient-to-r from-slate-800 to-slate-900"></div>
        </div>
      ),
    },
    {
      id: "red",
      name: "Ruby Red",
      primary: "#fca5a5",
      secondary: "#ef4444",
      accent: "#dc2626",
      background: "#7f1d1d",
      preview: (
        <div className="h-full w-full rounded-md overflow-hidden">
          <div className="h-1/2 bg-gradient-to-r from-red-400 to-red-600"></div>
          <div className="h-1/2 bg-gradient-to-r from-slate-800 to-slate-900"></div>
        </div>
      ),
    },
    {
      id: "custom",
      name: "Custom Colors",
      primary: "#c084fc",
      secondary: "#a855f7",
      accent: "#9333ea",
      background: "#1e1b4b",
      preview: (
        <div className="h-full w-full rounded-md overflow-hidden flex items-center justify-center bg-slate-800">
          <Paintbrush className="h-8 w-8 text-white opacity-70" />
        </div>
      ),
    },
  ]

  const handleApplyTheme = () => {
    // Logic to apply the selected theme and color scheme
    console.log("Applying theme:", activeTheme, "with color scheme:", activeColorScheme)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Theme Customization</h1>
          <p className="text-muted-foreground">Personalize the look and feel of your dashboard</p>
        </div>
        <Button onClick={handleApplyTheme} className="bg-zamora-purple hover:bg-zamora-purple-dark">
          Apply Theme
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Theme Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Choose between dark and light mode for your dashboard.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themes.map((theme) => (
              <Card
                key={theme.id}
                className={`cursor-pointer transition-all ${
                  activeTheme === theme.id ? "border-2 border-zamora-purple" : "hover:border-zamora-purple/50"
                }`}
                onClick={() => setActiveTheme(theme.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {theme.icon}
                      <span className="ml-2 font-medium">{theme.name}</span>
                    </div>
                    {activeTheme === theme.id && (
                      <div className="h-5 w-5 rounded-full bg-zamora-purple flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{theme.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Color Scheme</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Select a color scheme for your dashboard.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {colorSchemes.map((scheme) => (
              <Card
                key={scheme.id}
                className={`cursor-pointer transition-all ${
                  activeColorScheme === scheme.id ? "border-2 border-zamora-purple" : "hover:border-zamora-purple/50"
                }`}
                onClick={() => {
                  setActiveColorScheme(scheme.id)
                  if (scheme.id === "custom") {
                    setCustomizing(true)
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="h-20 mb-2 rounded-md overflow-hidden">{scheme.preview}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{scheme.name}</span>
                    {activeColorScheme === scheme.id && (
                      <div className="h-5 w-5 rounded-full bg-zamora-purple flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {customizing && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-medium mb-4">Custom Color Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="primary-color" className="block text-sm font-medium mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      id="primary-color"
                      defaultValue="#c084fc"
                      className="h-9 w-9 rounded-md border border-input mr-2"
                    />
                    <input
                      type="text"
                      defaultValue="#c084fc"
                      className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="secondary-color" className="block text-sm font-medium mb-1">
                    Secondary Color
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      id="secondary-color"
                      defaultValue="#a855f7"
                      className="h-9 w-9 rounded-md border border-input mr-2"
                    />
                    <input
                      type="text"
                      defaultValue="#a855f7"
                      className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="accent-color" className="block text-sm font-medium mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      id="accent-color"
                      defaultValue="#9333ea"
                      className="h-9 w-9 rounded-md border border-input mr-2"
                    />
                    <input
                      type="text"
                      defaultValue="#9333ea"
                      className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="background-color" className="block text-sm font-medium mb-1">
                    Background Color
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      id="background-color"
                      defaultValue="#1e1b4b"
                      className="h-9 w-9 rounded-md border border-input mr-2"
                    />
                    <input
                      type="text"
                      defaultValue="#1e1b4b"
                      className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>UI Customization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Card Style</h3>
                <p className="text-xs text-muted-foreground">Appearance of dashboard cards</p>
              </div>
              <select className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="default">Default</option>
                <option value="flat">Flat</option>
                <option value="glass">Glass Morphism</option>
                <option value="bordered">Bordered</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Border Radius</h3>
                <p className="text-xs text-muted-foreground">Roundness of UI elements</p>
              </div>
              <select className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="default">Default</option>
                <option value="small">Small</option>
                <option value="large">Large</option>
                <option value="none">None (Square)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Font</h3>
                <p className="text-xs text-muted-foreground">Typography for the dashboard</p>
              </div>
              <select className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="default">Default (Inter)</option>
                <option value="system">System Font</option>
                <option value="mono">Monospace</option>
                <option value="serif">Serif</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Animation Level</h3>
                <p className="text-xs text-muted-foreground">Amount of motion in the UI</p>
              </div>
              <select className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="default">Default</option>
                <option value="minimal">Minimal</option>
                <option value="none">None</option>
                <option value="enhanced">Enhanced</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

