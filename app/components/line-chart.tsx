"use client"
import { Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react"

interface LineChartProps {
  data: Array<{ month: string; value: number; prevYear?: number }>
  color: string
  showPrevYear?: boolean
  valueFormatter?: (value: number) => string
  compareData?: Array<{ month: string; value: number }>
  compareLabel?: string
  minimal?: boolean
  title?: string
  gridWidth?: number
  gridHeight?: number
}

export function LineChart({
  data,
  color,
  showPrevYear = false,
  valueFormatter = (value) => `${value}`,
  compareData,
  compareLabel = "Previous Year",
  minimal = false,
  title = "Chart",
  gridWidth = 4,
  gridHeight = 3,
}: LineChartProps) {
  // Prepare combined data if compareData is provided
  const combinedData = data.map((item, index) => {
    if (compareData && compareData[index]) {
      return {
        ...item,
        prevYear: compareData[index].value,
      }
    }
    return item
  })

  // Use either the explicit compareData or the showPrevYear flag
  const shouldShowComparison = compareData || showPrevYear

  // For minimal mode, simplify the data to just a few points
  const displayData = minimal ? data : data

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
                <RechartsLineChart data={displayData}>
                  <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // For minimal mode, simplify rendering
  if (minimal) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </RechartsLineChart>
      </ResponsiveContainer>
    )
  }

  // For medium and larger widgets, show the full chart
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={shouldShowComparison && !minimal ? combinedData : displayData}
          margin={
            minimal
              ? { top: 0, right: 0, bottom: 0, left: 0 }
              : isMedium
                ? { top: 10, right: 10, bottom: 20, left: 30 }
                : { top: 20, right: 10, bottom: 30, left: 40 }
          }
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            {shouldShowComparison && !minimal && (
              <linearGradient id="colorPrevYear" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#888888" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#888888" stopOpacity={0} />
              </linearGradient>
            )}
          </defs>

          {!minimal && (
            <XAxis
              dataKey="month"
              stroke="#888888"
              fontSize={10}
              tickLine={false}
              axisLine={true}
              tick={{ fontSize: isMedium ? "0.6rem" : "0.7rem" }}
              tickMargin={8}
              interval={isMedium ? "preserveEnd" : "preserveStartEnd"}
            />
          )}

          {!minimal && (
            <YAxis
              stroke="#888888"
              fontSize={10}
              tickLine={false}
              axisLine={true}
              tickFormatter={(value) => valueFormatter(value)}
              tick={{ fontSize: isMedium ? "0.6rem" : "0.7rem" }}
              width={isMedium ? 35 : 45}
            />
          )}

          {!minimal && (
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(30, 30, 45, 0.9)",
                borderColor: color,
                borderWidth: "1px",
                borderRadius: "8px",
                backdropFilter: "blur(8px)",
                padding: "8px",
                fontSize: "0.75rem",
              }}
              itemStyle={{ color: "#fff", fontSize: "0.75rem", padding: "2px 0" }}
              labelStyle={{ color: "#888888", fontSize: "0.75rem", marginBottom: "4px" }}
              formatter={(value, name) => {
                // If the dataKey is "prevYear", label it as "Previous Year"
                return [valueFormatter(value as number), name === "prevYear" ? compareLabel : "Current Year"]
              }}
              wrapperStyle={{ zIndex: 100 }}
            />
          )}

          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={minimal ? 2 : isMedium ? 1.5 : 2}
            dot={
              minimal
                ? false
                : isMedium
                  ? false
                  : {
                      fill: color,
                      stroke: color,
                      strokeWidth: 1,
                      r: 2,
                    }
            }
            activeDot={
              minimal
                ? false
                : {
                    fill: color,
                    stroke: "#fff",
                    strokeWidth: 1,
                    r: isMedium ? 2 : 3,
                  }
            }
          />

          {shouldShowComparison && !minimal && (
            <Line
              type="monotone"
              dataKey="prevYear"
              stroke="#888888"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={
                isMedium
                  ? false
                  : {
                      fill: "#888888",
                      stroke: "#888888",
                      strokeWidth: 1,
                      r: 1.5,
                    }
              }
              activeDot={{
                fill: "#888888",
                stroke: "#fff",
                strokeWidth: 1,
                r: isMedium ? 2 : 2.5,
              }}
            />
          )}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}

