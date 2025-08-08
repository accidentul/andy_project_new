"use client"

import { Area, AreaChart as RechartsAreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, ArrowUp, ArrowDown } from "lucide-react"

interface AreaChartProps {
  data: Array<{ month: string; value: number }>
  color: string
  valueFormatter?: (value: number) => string
  minimal?: boolean
  title?: string
  gridWidth?: number
  gridHeight?: number
}

export function AreaChart({
  data,
  color,
  valueFormatter = (value) => `${value}`,
  minimal = false,
  title = "Chart",
  gridWidth = 4,
  gridHeight = 3,
}: AreaChartProps) {
  // For minimal mode, simplify the data to just a few points
  const displayData = minimal && data.length > 4 ? data.filter((_, i) => i % Math.ceil(data.length / 4) === 0) : data

  // Calculate the current trend
  const currentValue = data[data.length - 1]?.value || 0
  const previousValue = data[data.length - 2]?.value || 0
  const percentChange = previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0
  const isPositive = percentChange >= 0

  // Determine what to render based on widget size
  const isVerySmall = gridWidth <= 2 && gridHeight <= 1
  const isSmall = gridWidth <= 2 && gridHeight <= 2
  const isMedium = gridWidth <= 4 && gridHeight <= 3

  // For very small widgets, just show a trend indicator
  if (isVerySmall) {
    return (
      <Card className="h-full w-full">
        <CardContent className="p-2 flex flex-col justify-between h-full">
          <span className="text-xs text-muted-foreground font-medium truncate">{title}</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg font-bold">{valueFormatter(currentValue)}</span>
            <div className={`flex items-center ${isPositive ? "text-green-500" : "text-red-500"}`}>
              {isPositive ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
              <span className="text-xs ml-1 font-medium">{Math.abs(percentChange).toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // For small widgets, show a simplified trend view
  if (isSmall) {
    return (
      <Card className="h-full w-full">
        <CardHeader className="p-3">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{valueFormatter(currentValue)}</p>
              <div className={`flex items-center ${isPositive ? "text-green-500" : "text-red-500"}`}>
                {isPositive ? <TrendingUp size={16} /> : <ArrowDown size={16} />}
                <span className="text-xs ml-1">{Math.abs(percentChange).toFixed(1)}%</span>
              </div>
            </div>
            <div className="h-16 w-16">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart data={displayData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={1.5}
                    fillOpacity={0.5}
                    fill="url(#colorValue)"
                  />
                </RechartsAreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (minimal) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={displayData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`colorValue-${title.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fillOpacity={0.5}
            fill={`url(#colorValue-${title.replace(/\s+/g, "")})`}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    )
  }

  // For medium and larger widgets, show the full chart
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={displayData}
          margin={
            isMedium ? { top: 10, right: 10, bottom: 20, left: 30 } : { top: 20, right: 20, bottom: 20, left: 40 }
          }
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="month"
            stroke="#888888"
            fontSize={isMedium ? 10 : 12}
            tickLine={false}
            axisLine={true}
            tick={{ fontSize: isMedium ? "0.6rem" : "0.7rem" }}
            interval={isMedium ? "preserveEnd" : "preserveStartEnd"}
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
              backgroundColor: "rgba(30, 30, 45, 0.8)",
              borderColor: color,
              borderWidth: "1px",
              borderRadius: "8px",
              backdropFilter: "blur(8px)",
            }}
            itemStyle={{ color: "#fff" }}
            labelStyle={{ color: "#888888" }}
            formatter={(value) => [valueFormatter(value as number), ""]}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={isMedium ? 1 : 1.5}
            fillOpacity={isMedium ? 0.6 : 0.8}
            fill="url(#colorValue)"
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
}

