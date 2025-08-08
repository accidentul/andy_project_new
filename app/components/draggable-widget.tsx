"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { WidgetMenu } from "./widget-menu"
import type { Widget } from "@/hooks/use-draggable-widgets"
import { ArrowDownRight } from "lucide-react"

interface DraggableWidgetProps {
  widget: Widget
  children: React.ReactNode
  rearrangeMode: boolean
  isDragging: boolean
  isDragOver: boolean
  isResizing: boolean
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd: () => void
  onRemove: () => void
  onCustomize: () => void
  onIncreaseSize: () => void
  onDecreaseSize: () => void
  onResize: (gridWidth: number, gridHeight: number) => void
  onStartResizing: () => void
  onStopResizing: () => void
  gridRef: React.RefObject<HTMLDivElement>
}

export function DraggableWidget({
  widget,
  children,
  rearrangeMode,
  isDragging,
  isDragOver,
  isResizing,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
  onCustomize,
  onIncreaseSize,
  onDecreaseSize,
  onResize,
  onStartResizing,
  onStopResizing,
  gridRef,
}: DraggableWidgetProps) {
  const [isHovering, setIsHovering] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const resizeStartPos = useRef<{ x: number; y: number } | null>(null)
  const initialSize = useRef<{ width: number; height: number } | null>(null)
  const initialGridSize = useRef<{ width: number; height: number } | null>(null)
  const lastGridSize = useRef<{ width: number; height: number } | null>(null)
  const resizeDirection = useRef<{ horizontal: boolean; vertical: boolean } | null>(null)

  // Add a shake animation when entering rearrange mode
  useEffect(() => {
    if (rearrangeMode && widgetRef.current) {
      widgetRef.current.classList.add("animate-shake")

      const timer = setTimeout(() => {
        if (widgetRef.current) {
          widgetRef.current.classList.remove("animate-shake")
        }
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [rearrangeMode])

  // Handle resize mouse down
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (!rearrangeMode) return // Only allow resizing in rearrange mode

    e.preventDefault()
    e.stopPropagation()

    if (!widgetRef.current || !cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    resizeStartPos.current = { x: e.clientX, y: e.clientY }
    initialSize.current = { width: rect.width, height: rect.height }
    initialGridSize.current = {
      width: widget.gridWidth || 1,
      height: widget.gridHeight || 1,
    }
    lastGridSize.current = {
      width: widget.gridWidth || 1,
      height: widget.gridHeight || 1,
    }
    resizeDirection.current = { horizontal: false, vertical: false }
    onStartResizing()

    // Add global event listeners
    document.addEventListener("mousemove", handleResizeMouseMove)
    document.addEventListener("mouseup", handleResizeMouseUp)
  }

  // Update the handleResizeMouseMove function to maintain height when only width changes
  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!resizeStartPos.current || !initialSize.current || !cardRef.current || !initialGridSize.current) return

    const deltaX = e.clientX - resizeStartPos.current.x
    const deltaY = e.clientY - resizeStartPos.current.y

    // Determine resize direction based on significant movement
    if (resizeDirection.current) {
      // Only set direction if it hasn't been determined yet for this resize operation
      if (!resizeDirection.current.horizontal && Math.abs(deltaX) > 20) {
        resizeDirection.current.horizontal = true
      }
      if (!resizeDirection.current.vertical && Math.abs(deltaY) > 20) {
        resizeDirection.current.vertical = true
      }
    }

    // Calculate the base cell size (assuming a 6x6 grid)
    const baseCellWidth = initialSize.current.width / initialGridSize.current.width
    const baseCellHeight = initialSize.current.height / initialGridSize.current.height

    // Calculate new width and height
    let newWidth = Math.max(baseCellWidth, initialSize.current.width + deltaX)
    let newHeight = Math.max(baseCellHeight, initialSize.current.height + deltaY)

    // Calculate how many grid cells the new size represents
    let gridCellsWide = Math.min(6, Math.max(1, Math.round(newWidth / baseCellWidth)))
    let gridCellsHigh = Math.min(6, Math.max(1, Math.round(newHeight / baseCellHeight)))

    // CRITICAL: If only horizontal resizing is happening, maintain the original height
    if (resizeDirection.current && resizeDirection.current.horizontal && !resizeDirection.current.vertical) {
      gridCellsHigh = initialGridSize.current.height
      newHeight = gridCellsHigh * baseCellHeight
    }

    // If only vertical resizing is happening, maintain the original width
    if (resizeDirection.current && !resizeDirection.current.horizontal && resizeDirection.current.vertical) {
      gridCellsWide = initialGridSize.current.width
      newWidth = gridCellsWide * baseCellWidth
    }

    // Calculate snapped dimensions
    const snappedWidth = gridCellsWide * baseCellWidth
    const snappedHeight = gridCellsHigh * baseCellHeight

    // Apply real-time size changes with smooth animation
    cardRef.current.style.transition =
      "width 0.15s cubic-bezier(0.4, 0, 0.2, 1), height 0.15s cubic-bezier(0.4, 0, 0.2, 1)"
    cardRef.current.style.width = `${snappedWidth}px`
    cardRef.current.style.height = `${snappedHeight}px`

    // Only update the state if the grid size has changed
    if (
      lastGridSize.current &&
      (lastGridSize.current.width !== gridCellsWide || lastGridSize.current.height !== gridCellsHigh)
    ) {
      // Update the widget size in the state
      onResize(gridCellsWide, gridCellsHigh)

      // Update the last grid size
      lastGridSize.current = {
        width: gridCellsWide,
        height: gridCellsHigh,
      }
    }
  }

  // Handle resize mouse up
  const handleResizeMouseUp = () => {
    resizeStartPos.current = null
    initialSize.current = null
    initialGridSize.current = null
    lastGridSize.current = null
    resizeDirection.current = null
    onStopResizing()

    // Remove global event listeners
    document.removeEventListener("mousemove", handleResizeMouseMove)
    document.removeEventListener("mouseup", handleResizeMouseUp)

    // Reset inline styles
    if (cardRef.current) {
      cardRef.current.style.transition = ""
      cardRef.current.style.width = ""
      cardRef.current.style.height = ""
    }
  }

  // Create grid overlay for visualization during resize
  const renderGridOverlay = () => {
    if (!isResizing) return null

    return (
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="grid grid-cols-6 grid-rows-6 h-full w-full">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="border border-purple-500/20" />
          ))}
        </div>
      </div>
    )
  }

  // Handle widget menu actions
  const handleRearrange = () => {
    if (!rearrangeMode) {
      onDragStart()
    }
  }

  return (
    <div
      ref={widgetRef}
      className={`
        h-full w-full
        transition-all duration-300 ease-in-out
        ${rearrangeMode ? "cursor-move" : ""}
        ${isDragging ? "opacity-50 scale-95 z-50" : ""}
        ${isDragOver ? "scale-105 z-10" : ""}
        ${rearrangeMode && !isDragging ? "animate-float" : ""}
        ${isResizing ? "z-50" : ""}
      `}
      draggable={rearrangeMode}
      onDragStart={rearrangeMode ? onDragStart : undefined}
      onDragOver={rearrangeMode ? onDragOver : undefined}
      onDrop={rearrangeMode ? onDrop : undefined}
      onDragEnd={rearrangeMode ? onDragEnd : undefined}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Card
        ref={cardRef}
        className={`
          relative h-full
          ${rearrangeMode ? "border-2 border-dashed border-purple-500 shadow-lg animate-pulse-border" : ""}
          ${isDragOver ? "border-2 border-blue-500" : ""}
          ${isResizing ? "border-2 border-green-500" : ""}
        `}
      >
        {renderGridOverlay()}

        {/* Widget menu - always functional regardless of rearrange mode, but hidden on mobile */}
        <div className="absolute top-2 right-2 z-10 hidden md:block">
          <WidgetMenu
            onRemove={onRemove}
            onCustomize={onCustomize}
            onIncreaseSize={onIncreaseSize}
            onDecreaseSize={onDecreaseSize}
            onRearrange={handleRearrange}
            currentSize={widget.size}
          />
        </div>

        {/* Resize handle - only visible in rearrange mode */}
        {rearrangeMode && (
          <div
            className={`
              absolute bottom-0 right-0 w-6 h-6 flex items-center justify-center
              cursor-nwse-resize z-20 text-muted-foreground hover:text-foreground
              ${isHovering || isResizing ? "opacity-100" : "opacity-0"}
              transition-opacity duration-200
            `}
            onMouseDown={handleResizeMouseDown}
          >
            <ArrowDownRight className="h-4 w-4" />
          </div>
        )}

        <div className="h-full w-full overflow-hidden">{children}</div>
      </Card>
    </div>
  )
}

