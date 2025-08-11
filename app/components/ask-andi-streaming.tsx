"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Brain, Bot, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAuthToken } from "@/lib/api"

interface StreamingChatProps {
  query: string
  onComplete?: (response: string) => void
  onError?: (error: string) => void
}

export function StreamingChat({ query, onComplete, onError }: StreamingChatProps) {
  const [streamedContent, setStreamedContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!query) return

    const startStreaming = async () => {
      setIsStreaming(true)
      setStreamedContent("")

      try {
        const token = getAuthToken()
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"
        
        // Create EventSource for SSE
        const eventSource = new EventSource(
          `${baseUrl}/api/ai/chat/stream?query=${encodeURIComponent(query)}`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`,
            } as any, // EventSource doesn't directly support headers, would need polyfill
          }
        )

        eventSourceRef.current = eventSource

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.type === "content") {
              setStreamedContent((prev) => prev + data.content)
            } else if (data.type === "done") {
              setIsStreaming(false)
              eventSource.close()
              if (onComplete) {
                onComplete(streamedContent)
              }
            } else if (data.type === "error") {
              setIsStreaming(false)
              eventSource.close()
              if (onError) {
                onError(data.message || "Streaming error occurred")
              }
            }
          } catch (error) {
            console.error("Failed to parse SSE data:", error)
          }
        }

        eventSource.onerror = (error) => {
          console.error("SSE error:", error)
          setIsStreaming(false)
          eventSource.close()
          if (onError) {
            onError("Connection lost")
          }
        }
      } catch (error) {
        console.error("Streaming error:", error)
        setIsStreaming(false)
        if (onError) {
          onError(error instanceof Error ? error.message : "Failed to start streaming")
        }
      }
    }

    startStreaming()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [query])

  return (
    <div className="flex flex-col gap-2">
      {isStreaming && (
        <div className="flex items-center gap-2 text-xs text-purple-400">
          <Bot className="h-4 w-4 animate-pulse" />
          <span>AI is thinking...</span>
          <Sparkles className="h-3 w-3 animate-spin" />
        </div>
      )}
      
      {streamedContent && (
        <div className="bg-slate-800/50 rounded-lg p-3 text-slate-200">
          <div className="whitespace-pre-wrap text-sm">{streamedContent}</div>
        </div>
      )}
    </div>
  )
}

// Hook for using streaming chat
export function useStreamingChat() {
  const [response, setResponse] = useState<string>("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const streamChat = async (query: string) => {
    setIsStreaming(true)
    setError(null)
    setResponse("")

    try {
      const token = getAuthToken()
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"
      
      const response = await fetch(`${baseUrl}/api/ai/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      let fullResponse = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === "content") {
                fullResponse += data.content
                setResponse(fullResponse)
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      setIsStreaming(false)
      return fullResponse
    } catch (err) {
      setIsStreaming(false)
      const errorMessage = err instanceof Error ? err.message : "Streaming failed"
      setError(errorMessage)
      throw err
    }
  }

  return {
    streamChat,
    response,
    isStreaming,
    error,
  }
}