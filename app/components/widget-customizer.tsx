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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { WidgetType } from "./widget-gallery"

interface WidgetCustomizerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  widget: WidgetType | null
  onSave: (widget: WidgetType) => void
}

export function WidgetCustomizer({ open, onOpenChange, widget, onSave }: WidgetCustomizerProps) {
  const [title, setTitle] = useState(widget?.title || "")
  const [refreshInterval, setRefreshInterval] = useState("5")
  const [showLegend, setShowLegend] = useState(true)
  const [dataSource, setDataSource] = useState("automatic")

  if (!widget) return null

  const handleSave = () => {
    onSave({
      ...widget,
      title,
      // In a real app, you would save the other settings too
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Customize Widget</DialogTitle>
          <DialogDescription>Adjust the settings for this widget</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="refresh" className="text-right">
              Refresh Interval
            </Label>
            <Select value={refreshInterval} onValueChange={setRefreshInterval}>
              <SelectTrigger className="col-span-3" id="refresh">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 minute</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="data-source" className="text-right">
              Data Source
            </Label>
            <Select value={dataSource} onValueChange={setDataSource}>
              <SelectTrigger className="col-span-3" id="data-source">
                <SelectValue placeholder="Select data source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="automatic">Automatic</SelectItem>
                <SelectItem value="salesforce">Salesforce</SelectItem>
                <SelectItem value="google-analytics">Google Analytics</SelectItem>
                <SelectItem value="hubspot">HubSpot</SelectItem>
                <SelectItem value="custom">Custom API</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="show-legend" className="text-right">
              Show Legend
            </Label>
            <div className="flex items-center space-x-2 col-span-3">
              <Switch id="show-legend" checked={showLegend} onCheckedChange={setShowLegend} />
              <Label htmlFor="show-legend">{showLegend ? "On" : "Off"}</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

