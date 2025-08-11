import type React from "react"
import { Card, CardContent } from "@/components/ui/card"

interface TinyWidgetProps {
  title: string
  value: string
  icon: React.ReactNode
  color: string
}

export function TinyWidget({ title, value, icon, color }: TinyWidgetProps) {
  const getColorClass = (color: string) => {
    switch (color) {
      case "primary":
        return "text-primary"
      case "purple":
        return "text-purple-500"
      case "blue":
        return "text-blue-500"
      case "teal":
        return "text-teal-500"
      case "green":
        return "text-green-600"
      default:
        return "text-primary"
    }
  }

  const colorClass = getColorClass(color)

  return (
    <Card className="h-full">
      <CardContent className="p-2 flex flex-col h-full">
        <span className="text-xs text-muted-foreground font-medium truncate mb-1">{title}</span>
        <div className="flex items-center justify-between mt-auto">
          <span className={`text-lg font-bold ${colorClass}`}>{value}</span>
          <div className={`${colorClass}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

