"use client"

import { MoreHorizontal, Trash2, Pencil, Move, Maximize, Minimize } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface WidgetOptionsMenuProps {
  widgetId: string
  widgetTitle: string
  onRemove: (id: string) => void
  onCustomize: (id: string) => void
  onResize: (id: string, size: "small" | "medium" | "large") => void
  currentSize: "small" | "medium" | "large"
  onRearrange: () => void
}

export function WidgetOptionsMenu({
  widgetId,
  widgetTitle,
  onRemove,
  onCustomize,
  onResize,
  currentSize,
  onRearrange,
}: WidgetOptionsMenuProps) {
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)

  const handleRemove = () => {
    setConfirmRemoveOpen(false)
    onRemove(widgetId)
  }

  const handleCustomize = () => {
    setCustomizeOpen(false)
    onCustomize(widgetId)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-70 hover:opacity-100 hover:bg-secondary z-10"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem
            onClick={() => setCustomizeOpen(true)}
            className="focus:bg-transparent focus:text-foreground focus:outline focus:outline-1 focus:outline-primary"
          >
            <Pencil className="mr-2 h-4 w-4" />
            <span>Customize Widget</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onRearrange}
            className="focus:bg-transparent focus:text-foreground focus:outline focus:outline-1 focus:outline-primary"
          >
            <Move className="mr-2 h-4 w-4" />
            <span>Rearrange Widgets</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onResize(widgetId, currentSize === "small" ? "medium" : "small")}
            disabled={currentSize === "large"}
            className="focus:bg-transparent focus:text-foreground focus:outline focus:outline-1 focus:outline-primary disabled:opacity-50"
          >
            <Minimize className="mr-2 h-4 w-4" />
            <span>{currentSize === "small" ? "Medium Size" : "Small Size"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onResize(widgetId, currentSize === "large" ? "medium" : "large")}
            disabled={currentSize === "small"}
            className="focus:bg-transparent focus:text-foreground focus:outline focus:outline-1 focus:outline-primary disabled:opacity-50"
          >
            <Maximize className="mr-2 h-4 w-4" />
            <span>{currentSize === "large" ? "Medium Size" : "Large Size"}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setConfirmRemoveOpen(true)}
            className="text-red-500 focus:bg-transparent focus:text-red-500 focus:outline focus:outline-1 focus:outline-red-500"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Remove Widget</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirm Remove Dialog */}
      <Dialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove Widget</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the "{widgetTitle}" widget? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemoveOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customize Widget Dialog */}
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Customize Widget: {widgetTitle}</DialogTitle>
            <DialogDescription>Adjust the settings for this widget</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="widget-title" className="text-right text-sm font-medium">
                Title
              </label>
              <input
                id="widget-title"
                defaultValue={widgetTitle}
                className="col-span-3 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="widget-refresh" className="text-right text-sm font-medium">
                Refresh Rate
              </label>
              <select
                id="widget-refresh"
                defaultValue="5"
                className="col-span-3 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="1">1 minute</option>
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="widget-visualization" className="text-right text-sm font-medium">
                Visualization
              </label>
              <select
                id="widget-visualization"
                defaultValue="default"
                className="col-span-3 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="default">Default</option>
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="gauge">Gauge</option>
                <option value="number">Number</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="widget-color" className="text-right text-sm font-medium">
                Accent Color
              </label>
              <select
                id="widget-color"
                defaultValue="purple"
                className="col-span-3 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="purple">Purple</option>
                <option value="blue">Blue</option>
                <option value="teal">Teal</option>
                <option value="green">Green</option>
                <option value="amber">Amber</option>
                <option value="red">Red</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomizeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCustomize}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

