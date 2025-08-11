"use client"

import { useState, useRef, useEffect } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CollapsibleSearchProps {
  onExpandChange: (expanded: boolean) => void
}

export function CollapsibleSearch({ onExpandChange }: CollapsibleSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleSearch = () => {
    const newExpandedState = !isExpanded
    setIsExpanded(newExpandedState)
    onExpandChange(newExpandedState)

    if (newExpandedState && inputRef.current) {
      // Focus the input when expanding
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  // Handle clicks outside to collapse the search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) && isExpanded) {
        setIsExpanded(false)
        onExpandChange(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isExpanded, onExpandChange])

  return (
    <div ref={containerRef} className="relative">
      {isExpanded ? (
        <div className="relative w-full transition-all duration-300 ease-in-out">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            className="rounded-full bg-secondary h-9 w-[180px] pl-8 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-zamora-purple"
          />
        </div>
      ) : (
        <Button variant="ghost" size="icon" onClick={toggleSearch} className="rounded-full">
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
      )}
    </div>
  )
}

