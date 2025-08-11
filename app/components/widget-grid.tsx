"use client"

import type React from "react"

import { useDraggableWidgets, type Widget } from "@/hooks/use-draggable-widgets"
import { DraggableWidget } from "./draggable-widget"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Save, Sliders } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface WidgetGridProps {
  initialWidgets: Widget[]
  renderWidget: (widget: Widget) => React.ReactNode
  onCustomizeWidget?: (widget: Widget) => void
}

export function WidgetGrid({ initialWidgets, renderWidget, onCustomizeWidget }: WidgetGridProps) {
  const {
    widgets,
    rearrangeMode,
    draggedWidget,
    dragOverWidget,
    resizingWidget,
    toggleRearrangeMode,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    startResizing,
    stopResizing,
    handleResize,
    cycleWidgetSize,
    increaseWidgetSize,
    decreaseWidgetSize,
    addWidget,
    removeWidget,
    gridRef,
  } = useDraggableWidgets(initialWidgets)

  const [confirmDialog, setConfirmDialog] = useState(false)
  const [widgetToRemove, setWidgetToRemove] = useState<string | null>(null)

  // Sync newly provided initialWidgets (e.g., AI suggestions) into grid state
  useEffect(() => {
    const currentIds = new Set(widgets.map((w) => w.id))
    const toAdd = initialWidgets.filter((w) => !currentIds.has(w.id))
    if (toAdd.length > 0) {
      for (const w of toAdd) {
        // addWidget expects a widget without the 'order' field
        const { order, ...rest } = w as any
        // Guard against duplicates by id
        if (!currentIds.has(rest.id)) {
          addWidget(rest)
        }
      }
    }
  }, [initialWidgets, widgets, addWidget])

  // Handle widget removal with confirmation
  const handleRemoveWidget = (widgetId: string) => {
    setWidgetToRemove(widgetId)
    setConfirmDialog(true)
  }

  const confirmRemoveWidget = () => {
    if (widgetToRemove) {
      removeWidget(widgetToRemove)
      setWidgetToRemove(null)
    }
    setConfirmDialog(false)
  }

  // Adjust grid layout when sidebar collapses/expands
  useEffect(() => {
    const handleResize = () => {
      // Force grid to recalculate layout
      if (gridRef.current) {
        gridRef.current.style.opacity = "0.99"
        setTimeout(() => {
          if (gridRef.current) gridRef.current.style.opacity = "1"
        }, 50)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [gridRef])

  return (
    <div className="relative">
      {/* Customize Dashboard Button - Aligned with dashboard title */}
      <div className="absolute right-0 top-0 mb-4 -mt-14 md:block hidden">
        <Button
          onClick={toggleRearrangeMode}
          variant={rearrangeMode ? "default" : "outline"}
          className={rearrangeMode ? "bg-purple-600 hover:bg-purple-700" : ""}
          size="sm"
        >
          {rearrangeMode ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Done Customizing
            </>
          ) : (
            <>
              <Sliders className="mr-2 h-4 w-4" />
              Customize Dashboard
            </>
          )}
        </Button>
      </div>

      {/* Widget Grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4"
        style={{
          gridTemplateRows: "repeat(auto-fill, minmax(150px, 1fr))",
          gridAutoRows: "minmax(150px, auto)",
        }}
      >
        {widgets.map((widget) => {
          // Calculate grid span based on widget size
          let colSpan = 1
          let rowSpan = 1

          // On mobile, make all widgets full width
          const isMobile = window.innerWidth < 768

          if (isMobile) {
            colSpan = 1
            rowSpan = widget.size === "tiny" ? 1 : 2
          } else {
            switch (widget.size) {
              case "tiny":
                colSpan = 1
                rowSpan = 1
                break
              case "small":
                colSpan = 1
                rowSpan = 2
                break
              case "medium":
                colSpan = 2
                rowSpan = 2
                break
              case "large":
                colSpan = 4
                rowSpan = 3
                break
            }
          }

          return (
            <div
              key={widget.id}
              className="relative"
              style={{
                gridColumn: `span ${colSpan}`,
                gridRow: `span ${rowSpan}`,
                minHeight: rowSpan * 150 + "px",
              }}
            >
              <DraggableWidget
                widget={widget}
                rearrangeMode={rearrangeMode}
                isDragging={draggedWidget?.id === widget.id}
                isDragOver={dragOverWidget?.id === widget.id}
                isResizing={resizingWidget === widget.id}
                onDragStart={() => handleDragStart(widget)}
                onDragOver={(e) => handleDragOver(e, widget)}
                onDrop={(e) => handleDrop(e, widget)}
                onDragEnd={handleDragEnd}
                onRemove={() => handleRemoveWidget(widget.id)}
                onCustomize={() => onCustomizeWidget?.(widget)}
                onIncreaseSize={() => increaseWidgetSize(widget.id)}
                onDecreaseSize={() => decreaseWidgetSize(widget.id)}
                onResize={(gridWidth, gridHeight) => handleResize(widget.id, gridWidth, gridHeight)}
                onStartResizing={() => startResizing(widget.id)}
                onStopResizing={stopResizing}
                gridRef={gridRef}
              >
                {renderWidget(widget)}
              </DraggableWidget>
            </div>
          )
        })}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Widget</DialogTitle>
            <DialogDescription>Are you sure you want to remove this widget from your dashboard?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemoveWidget}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

