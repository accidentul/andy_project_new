import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')
  const token = searchParams.get('token')

  if (!query || !token) {
    return NextResponse.json({ error: 'Missing query or token' }, { status: 400 })
  }

  const encoder = new TextEncoder()
  
  // Create a readable stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // First, check if we need to use a tool based on the query
        const toolDecision = await decideToolUsage(query)
        
        if (toolDecision.useTool) {
          // Execute the appropriate tool
          const toolResult = await executeBackendTool(
            toolDecision.toolName,
            toolDecision.params,
            token
          )
          
          // Stream the tool results
          if (toolResult.success && toolResult.data) {
            // Send visualization data if available
            if (toolResult.data.visualization) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'visualization',
                  visualization: toolResult.data.visualization
                })}\n\n`)
              )
            }
            
            // Format and stream the content
            const content = formatToolResult(toolResult.data, query)
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'content',
                content
              })}\n\n`)
            )
          } else {
            // Error handling
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'content',
                content: toolResult.error || 'Failed to execute analysis'
              })}\n\n`)
            )
          }
        } else {
          // Use regular chat endpoint for non-tool queries
          const chatResponse = await callBackendChat(query, token)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'content',
              content: chatResponse.response?.content || chatResponse.response || 'I can help you with that.'
            })}\n\n`)
          )
        }
        
        // Send done signal
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        )
      } catch (error) {
        console.error('Error in stream:', error)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })}\n\n`)
        )
      } finally {
        controller.close()
      }
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

async function decideToolUsage(query: string): Promise<{
  useTool: boolean
  toolName: string
  params: any
}> {
  const lowerQuery = query.toLowerCase()
  
  // Check for analytics/data queries that should use dynamic_analytics tool
  const analyticsKeywords = [
    'show', 'list', 'count', 'total', 'sum', 'average', 'max', 'min',
    'by', 'per', 'for each', 'grouped', 'distribution', 'breakdown',
    'chart', 'graph', 'visualize', 'analyze', 'report',
    'sales', 'revenue', 'deals', 'opportunities', 'pipeline',
    'stage', 'owner', 'month', 'quarter', 'year',
    'top', 'bottom', 'best', 'worst', 'performance'
  ]
  
  const shouldUseAnalytics = analyticsKeywords.some(keyword => lowerQuery.includes(keyword))
  
  if (shouldUseAnalytics) {
    return {
      useTool: true,
      toolName: 'dynamic_analytics',
      params: {
        query: query,
        visualize: lowerQuery.includes('chart') || lowerQuery.includes('graph'),
        includeRawData: false
      }
    }
  }
  
  return {
    useTool: false,
    toolName: '',
    params: {}
  }
}

async function executeBackendTool(
  toolName: string,
  params: any,
  token: string
): Promise<any> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
  
  try {
    const response = await fetch(`${apiBase}/ai/tools/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        toolName,
        params
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error executing tool:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute tool'
    }
  }
}

async function callBackendChat(query: string, token: string): Promise<any> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
  
  try {
    const response = await fetch(`${apiBase}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error calling chat:', error)
    return {
      success: false,
      response: 'I encountered an error processing your request.'
    }
  }
}

function formatToolResult(data: any, query: string): string {
  let content = ''
  
  // Add summary
  if (data.summary) {
    content += `## Summary\n\n`
    content += `- **Records Found**: ${data.summary.recordCount || 0}\n`
    if (data.summary.total_amount) {
      content += `- **Total Amount**: $${data.summary.total_amount.toLocaleString()}\n`
    }
    if (data.summary.count) {
      content += `- **Total Count**: ${data.summary.count}\n`
    }
    content += '\n'
  }
  
  // Add insights
  if (data.insights && data.insights.length > 0) {
    content += `## Insights\n\n`
    data.insights.forEach((insight: string) => {
      content += `- ${insight}\n`
    })
    content += '\n'
  }
  
  // Add results in a formatted way
  if (data.results && data.results.length > 0) {
    content += `## Results\n\n`
    
    // If it's a simple aggregation with few results, show as list
    if (data.results.length <= 10) {
      data.results.forEach((row: any) => {
        const keys = Object.keys(row)
        if (keys.length === 2) {
          // Simple key-value pairs
          const [label, value] = keys
          content += `**${row[label]}**: ${formatValue(row[value])}\n`
        } else {
          // More complex data
          content += Object.entries(row)
            .map(([key, val]) => `${key}: ${formatValue(val)}`)
            .join(' | ') + '\n'
        }
      })
    } else {
      // For larger datasets, show as table
      content += '| ' + Object.keys(data.results[0]).join(' | ') + ' |\n'
      content += '| ' + Object.keys(data.results[0]).map(() => '---').join(' | ') + ' |\n'
      data.results.slice(0, 20).forEach((row: any) => {
        content += '| ' + Object.values(row).map(v => formatValue(v)).join(' | ') + ' |\n'
      })
      if (data.results.length > 20) {
        content += `\n*Showing first 20 of ${data.results.length} results*\n`
      }
    }
  }
  
  // Add query details if in debug mode
  if (data.query && process.env.NODE_ENV === 'development') {
    content += `\n## Query Details\n\n`
    content += `**Natural Language**: ${data.query.natural}\n\n`
    if (data.query.explanation) {
      content += `**Explanation**: ${data.query.explanation}\n`
    }
  }
  
  return content || 'Analysis completed successfully.'
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'number') {
    if (value > 1000) return value.toLocaleString()
    if (value < 1) return value.toFixed(2)
    return value.toString()
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value instanceof Date) return value.toLocaleDateString()
  return String(value)
}