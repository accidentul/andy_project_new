"use client"

import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart2 } from "lucide-react"

interface BarChartProps {
  data: Array<{ country: string; value: number }>
  color: string
  valueFormatter?: (value: number) => string
  minimal?: boolean
  title?: string
  gridWidth?: number
  gridHeight?: number
}

export function BarChart({
  data,
  color,
  valueFormatter = (value) => `${value}`,
  minimal = false,
  title = "Chart",
  gridWidth = 4,
  gridHeight = 3,
}: BarChartProps) {
  // For minimal mode, simplify the data to just a few points
  const displayData = minimal && data.length > 4 ? data.filter((_, i) => i % Math.ceil(data.length / 4) === 0) : data

  // Calculate the total value
  const totalValue = data.reduce((sum, item) => sum + item.value, 0)

  // Find the highest value item
  const highestItem = [...data].sort((a, b) => b.value - a.value)[0]

  // Determine what to render based on widget size
  const isVerySmall = gridWidth <= 2 && gridHeight <= 1
  const isSmall = gridWidth <= 2 && gridHeight <= 2
  const isMedium = gridWidth <= 4 && gridHeight <= 3

  // For very small widgets, just show a summary
  if (isVerySmall) {
    return (
      <Card className="h-full w-full">
        <CardContent className="p-2 flex flex-col justify-between h-full">
          <span className="text-xs text-muted-foreground font-medium truncate">{title}</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg font-bold">{valueFormatter(totalValue)}</span>
            <BarChart2 size={18} style={{ color }} />
          </div>
        </CardContent>
      </Card>
    )
  }

  // For small widgets, show a simplified view
  if (isSmall) {
    return (
      <Card className="h-full w-full">
        <CardHeader className="p-3">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{valueFormatter(totalValue)}</p>
              <p className="text-xs text-muted-foreground">
                Top: {highestItem?.country} ({valueFormatter(highestItem?.value)})
              </p>
            </div>
            <div className="h-16 w-16">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={displayData.slice(0, 3)}>
                  <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} barSize={8} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // For medium and larger widgets, show the full chart
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={displayData}
          margin={
            isMedium ? { top: 10, right: 10, bottom: 20, left: 30 } : { top: 20, right: 20, bottom: 20, left: 40 }
          }
        >
          <XAxis
            dataKey="country"
            stroke="#888888"
            fontSize={isMedium ? 10 : 12}
            tickLine={false}
            axisLine={true}
            tick={{ fontSize: isMedium ? "0.6rem" : "0.7rem" }}
            interval={isMedium ? 0 : "preserveStartEnd"}
            tickMargin={8}
          />

          <YAxis
            stroke="#888888"
            fontSize={isMedium ? 10 : 12}
            tickLine={false}
            axisLine={true}
            tickFormatter={(value) => valueFormatter(value)}
            tick={{ fontSize: isMedium ? "0.6rem" : "0.7rem" }}
            width={isMedium ? 35 : 45}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(30, 30, 45, 0.7)",
              borderColor: color,
              borderWidth: "1px",
              borderRadius: "8px",
              backdropFilter: "blur(8px)",
              boxShadow: `0 0 10px rgba(${
                color
                  .replace("#", "")
                  .match(/.{2}/g)
                  ?.map((hex) => Number.parseInt(hex, 16))
                  .join(", ") || "0, 0, 0"
              }, 0.3)`,
            }}
            cursor={{ fill: `${color}40` }}
            itemStyle={{ color: color }}
            labelStyle={{ color: "#ffffff" }}
            formatter={(value) => [valueFormatter(value as number), ""]}
          />

          <Bar
            dataKey="value"
            fill={color}
            radius={isMedium ? [2, 2, 0, 0] : [4, 4, 0, 0]}
            barSize={isMedium ? 15 : 20}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}

