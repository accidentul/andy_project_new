"use client"

import React from 'react'

interface PieChartData {
  label: string
  value: number
  percentage?: number
}

interface SimplePieChartProps {
  data: PieChartData[]
  size?: number
}

export function SimplePieChart({ data, size = 200 }: SimplePieChartProps) {
  console.log('SimplePieChart rendering with data:', data)
  
  if (!data || data.length === 0) {
    return <div>No data available</div>
  }
  
  // Calculate angles for each slice
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = -90 // Start from top
  
  const slices = data.map((item, index) => {
    const percentage = item.percentage || ((item.value / total) * 100)
    const angle = (item.value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    
    // Calculate path for the slice
    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180
    
    const x1 = size/2 + (size/2 - 10) * Math.cos(startAngleRad)
    const y1 = size/2 + (size/2 - 10) * Math.sin(startAngleRad)
    const x2 = size/2 + (size/2 - 10) * Math.cos(endAngleRad)
    const y2 = size/2 + (size/2 - 10) * Math.sin(endAngleRad)
    
    const largeArcFlag = angle > 180 ? 1 : 0
    
    const pathData = [
      `M ${size/2} ${size/2}`,
      `L ${x1} ${y1}`,
      `A ${size/2 - 10} ${size/2 - 10} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')
    
    currentAngle = endAngle
    
    const colors = [
      '#a855f7', // purple-500
      '#3b82f6', // blue-500
      '#14b8a6', // teal-500
      '#f59e0b', // amber-500
      '#ef4444', // red-500
      '#22c55e', // green-500
      '#8b5cf6', // violet-500
      '#06b6d4', // cyan-500
    ]
    
    return {
      path: pathData,
      color: colors[index % colors.length],
      label: item.label,
      percentage: percentage.toFixed(1),
      value: item.value
    }
  })
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="mb-3">
        {slices.map((slice, index) => (
          <g key={index}>
            <path
              d={slice.path}
              fill={slice.color}
              stroke="#1e293b"
              strokeWidth="2"
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          </g>
        ))}
      </svg>
      
      <div className="grid grid-cols-2 gap-2 text-xs w-full max-w-xs">
        {slices.map((slice, index) => (
          <div key={index} className="flex items-center">
            <div 
              className="h-3 w-3 rounded-sm mr-2 flex-shrink-0" 
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-slate-300 truncate">
              {slice.label}: {slice.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}