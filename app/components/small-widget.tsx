import { Card, CardContent } from "@/components/ui/card"
import type { ReactNode } from "react"

interface SmallWidgetProps {
  title: string
  value: string
  icon: ReactNode
  color: "purple" | "blue" | "teal" | "green" | "amber"
}

export function SmallWidget({ title, value, icon, color }: SmallWidgetProps) {
  const getColorClass = () => {
    switch (color) {
      case "purple":
        return "text-primary"
      case "blue":
        return "text-blue-500"
      case "teal":
        return "text-teal-500"
      case "green":
        return "text-green-600"
      case "amber":
        return "text-amber-500"
      default:
        return "text-primary"
    }
  }

  return (
    <Card className="h-full">
      <CardContent className="flex flex-col items-center justify-center h-full p-4">
        <div className="flex items-center justify-center mb-2 mt-2">
          <div className={`mr-2 ${getColorClass()}`}>{icon}</div>
          <div className="text-sm text-muted-foreground font-medium">{title}</div>
        </div>
        <div className={`text-2xl font-bold ${getColorClass()}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

