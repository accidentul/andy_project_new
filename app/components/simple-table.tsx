"use client"

import React from 'react'

interface SimpleTableProps {
  data: any[]
  columns?: string[]
}

export function SimpleTable({ data, columns }: SimpleTableProps) {
  if (!data || data.length === 0) {
    return <div className="text-slate-400 text-sm">No data available</div>
  }

  // Auto-detect columns from first row if not provided
  const tableColumns = columns || Object.keys(data[0])

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="border-b border-slate-600">
          <tr>
            {tableColumns.map((col) => (
              <th key={col} className="px-3 py-2 text-left text-purple-400 font-medium">
                {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b border-slate-700 hover:bg-slate-800/30">
              {tableColumns.map((col) => (
                <td key={col} className="px-3 py-2 text-slate-300">
                  {formatCellValue(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    // Format large numbers with commas
    if (value >= 1000) {
      return value.toLocaleString()
    }
    // Format decimals to 2 places
    if (value % 1 !== 0) {
      return value.toFixed(2)
    }
    return value.toString()
  }
  if (typeof value === 'boolean') {
    return value ? '✓' : '✗'
  }
  if (value instanceof Date) {
    return value.toLocaleDateString()
  }
  return String(value)
}