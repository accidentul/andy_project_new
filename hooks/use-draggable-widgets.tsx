"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"

export type WidgetSize = "tiny" | "small" | "medium" | "large"

export interface Widget {
  id: string
  title: string
  size: WidgetSize
  order: number
  gridWidth?: number
  gridHeight?: number
}

export function useDraggableWidgets(initialWidgets: Widget[]) {
  const [widgets, setWidgets] = useState<Widget[]>(
    initialWidgets.map((widget) => ({
      ...widget,
      gridWidth: getInitialGridWidth(widget.size),
      gridHeight: getInitialGridHeight(widget.size),
    })),
  )
  const [rearrangeMode, setRearrangeMode] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState<Widget | null>(null)
  const [dragOverWidget, setDragOverWidget] = useState<Widget | null>(null)
  const [resizingWidget, setResizingWidget] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Helper function to get initial grid width based on size
  function getInitialGridWidth(size: WidgetSize): number {
    switch (size) {
      case "tiny":
        return 1
      case "small":
        return 2
      case "medium":
        return 4
      case "large":
        return 6
      default:
        return 1
    }
  }

  // Helper function to get initial grid height based on size
  function getInitialGridHeight(size: WidgetSize): number {
    switch (size) {
      case "tiny":
        return 1
      case "small":
        return 2
      case "medium":
        return 3
      case "large":
        return 4
      default:
        return 1
    }
  }

  // Helper function to get size from grid dimensions
  function getSizeFromGrid(width: number, height: number): WidgetSize {
    // Determine size based on the total area
    const area = width * height

    if (area >= 20) return "large"
    if (area >= 10) return "medium"
    if (area >= 4) return "small"
    return "tiny"
  }

  // Toggle rearrange mode
  const toggleRearrangeMode = useCallback(() => {
    setRearrangeMode((prev) => !prev)
    // Exit resize mode when toggling rearrange mode
    setResizingWidget(null)
  }, [])

  // Handle drag start
  const handleDragStart = useCallback(
    (widget: Widget) => {
      if (!rearrangeMode) return
      setDraggedWidget(widget)
    },
    [rearrangeMode],
  )

  // Handle drag over
  const handleDragOver = useCallback(
    (e: React.DragEvent, widget: Widget) => {
      e.preventDefault()
      if (!rearrangeMode || !draggedWidget || widget.id === draggedWidget.id) return
      setDragOverWidget(widget)
    },
    [rearrangeMode, draggedWidget],
  )

  // Handle drop - swap widget positions
  const handleDrop = useCallback(
    (e: React.DragEvent, targetWidget: Widget) => {
      e.preventDefault()
      if (!rearrangeMode || !draggedWidget || targetWidget.id === draggedWidget.id) return

      // Swap positions by swapping order values
      setWidgets((prevWidgets) => {
        return prevWidgets.map((w) => {
          if (w.id === draggedWidget.id) {
            return { ...w, order: targetWidget.order }
          }
          if (w.id === targetWidget.id) {
            return { ...w, order: draggedWidget.order }
          }
          return w
        })
      })

      setDraggedWidget(null)
      setDragOverWidget(null)
    },
    [rearrangeMode, draggedWidget],
  )

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null)
    setDragOverWidget(null)
  }, [])

  // Start resizing a widget
  const startResizing = useCallback((widgetId: string) => {
    setResizingWidget(widgetId)
  }, [])

  // Stop resizing
  const stopResizing = useCallback(() => {
    setResizingWidget(null)
  }, [])

  // Handle resize with grid snapping and debouncing to prevent infinite loops
  const handleResize = useCallback((widgetId: string, gridWidth: number, gridHeight: number) => {
    // Clear any existing timeout
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current)
    }

    // Debounce the resize operation
    resizeTimeoutRef.current = setTimeout(() => {
      setWidgets((prevWidgets) => {
        const widget = prevWidgets.find((w) => w.id === widgetId)

        // If widget doesn't exist or dimensions haven't changed, don't update
        if (!widget || (widget.gridWidth === gridWidth && widget.gridHeight === gridHeight)) {
          return prevWidgets
        }

        // Update the widget with new grid dimensions
        return prevWidgets.map((w) => {
          if (w.id === widgetId) {
            const newSize = getSizeFromGrid(gridWidth, gridHeight)
            return {
              ...w,
              gridWidth,
              gridHeight,
              size: newSize,
            }
          }
          return w
        })
      })
    }, 10) // Reduced debounce time for smoother updates
  }, [])

  // Increase widget size
  const increaseWidgetSize = useCallback((widgetId: string) => {
    setWidgets((prevWidgets) => {
      return prevWidgets.map((w) => {
        if (w.id === widgetId) {
          const sizeMap: Record<WidgetSize, WidgetSize> = {
            tiny: "small",
            small: "medium",
            medium: "large",
            large: "large",
          }

          const newSize = sizeMap[w.size]

          return {
            ...w,
            size: newSize,
            gridWidth: getInitialGridWidth(newSize),
            gridHeight: getInitialGridHeight(newSize),
          }
        }
        return w
      })
    })
  }, [])

  // Decrease widget size
  const decreaseWidgetSize = useCallback((widgetId: string) => {
    setWidgets((prevWidgets) => {
      return prevWidgets.map((w) => {
        if (w.id === widgetId) {
          const sizeMap: Record<WidgetSize, WidgetSize> = {
            tiny: "tiny",
            small: "tiny",
            medium: "small",
            large: "medium",
          }

          const newSize = sizeMap[w.size]

          return {
            ...w,
            size: newSize,
            gridWidth: getInitialGridWidth(newSize),
            gridHeight: getInitialGridHeight(newSize),
          }
        }
        return w
      })
    })
  }, [])

  // Cycle to the next size
  const cycleWidgetSize = useCallback((widgetId: string) => {
    setWidgets((prevWidgets) => {
      return prevWidgets.map((w) => {
        if (w.id === widgetId) {
          const sizes: WidgetSize[] = ["tiny", "small", "medium", "large"]
          const currentIndex = sizes.indexOf(w.size)
          const nextIndex = (currentIndex + 1) % sizes.length
          const newSize = sizes[nextIndex]
          return {
            ...w,
            size: newSize,
            gridWidth: getInitialGridWidth(newSize),
            gridHeight: getInitialGridHeight(newSize),
          }
        }
        return w
      })
    })
  }, [])

  // Add a widget
  const addWidget = useCallback((widget: Omit<Widget, "order">) => {
    setWidgets((prevWidgets) => {
      const newWidget = {
        ...widget,
        order: prevWidgets.length,
        gridWidth: getInitialGridWidth(widget.size),
        gridHeight: getInitialGridHeight(widget.size),
      }
      return [...prevWidgets, newWidget]
    })
  }, [])

  // Remove a widget
  const removeWidget = useCallback((widgetId: string) => {
    setWidgets((prevWidgets) => {
      const filteredWidgets = prevWidgets.filter((w) => w.id !== widgetId)

      // Reorder remaining widgets
      return filteredWidgets.map((w, index) => ({
        ...w,
        order: index,
      }))
    })
  }, [])

  // Update widget size
  const updateWidgetSize = useCallback((widgetId: string, size: WidgetSize) => {
    setWidgets((prevWidgets) => {
      return prevWidgets.map((w) => {
        if (w.id === widgetId) {
          return {
            ...w,
            size,
            gridWidth: getInitialGridWidth(size),
            gridHeight: getInitialGridHeight(size),
          }
        }
        return w
      })
    })
  }, [])

  // Get sorted widgets
  const getSortedWidgets = useCallback(() => {
    return [...widgets].sort((a, b) => a.order - b.order)
  }, [widgets])

  return {
    widgets: getSortedWidgets(),
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
    updateWidgetSize,
    gridRef,
  }
}

