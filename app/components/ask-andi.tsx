"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Brain, FileText, PieChart, Mic, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LineChart } from "./line-chart"
import { BarChart } from "./bar-chart"
import { SimplePieChart } from "./pie-chart-simple"
import { SimpleTable } from "./simple-table"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from 'react-markdown'

interface ChatMessage {
  role: "user" | "system"
  content: string
  attachment?: "chart" | "report" | "pie" | "bar" | null
  isStreaming?: boolean
  visualization?: any
}

interface AskAndiProps {
  isOpen: boolean
  onClose: () => void
}

export function AskAndi({ isOpen, onClose }: AskAndiProps) {
  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      content: "Hello! I'm ANDI, your Adaptive Neural Data Intelligence assistant. How can I help you analyze your business data today?",
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  // Initialize speech recognition
  useEffect(() => {
    let SpeechRecognition: any = null
    let webkitSpeechRecognition: any = null

    if (typeof window !== "undefined") {
      SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      webkitSpeechRecognition = (window as any).webkitSpeechRecognition
    }

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setChatInput((prev) => prev + transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start()
        setIsListening(true)
      }
    }
  }

  // Handle chat input
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput,
    }
    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setIsTyping(true)

    // Create new response message
    const responseMessage: ChatMessage = {
      role: "system",
      content: "",
      isStreaming: true,
    }
    setChatMessages((prev) => [...prev, responseMessage])

    try {
      // Get auth token from localStorage (using the correct key)
      const token = localStorage.getItem('andi_token')
      if (!token) {
        setChatMessages((prev) => {
          const messages = [...prev]
          messages[messages.length - 1] = {
            role: "system",
            content: "Please log in to continue.",
            isStreaming: false,
          }
          return messages
        })
        setIsTyping(false)
        return
      }

      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      // Make API request to streaming endpoint
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
      const response = await fetch(
        `${apiBase}/api/ai/chat/stream?query=${encodeURIComponent(chatInput)}&token=${encodeURIComponent(token)}`,
        {
          method: 'GET',
          signal: abortControllerRef.current.signal,
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Read the stream with proper UTF-8 decoding
      const reader = response.body?.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ""
      let lastContent = ""
      let lastVisualization = null

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Decode with proper UTF-8 handling
          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          // Process complete lines
          const lines = buffer.split('\n')
          buffer = lines.pop() || "" // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6)
              if (dataStr.trim()) {
                try {
                  const data = JSON.parse(dataStr)
                  
                  if (data.type === 'content' && data.content) {
                    // Only update if content actually changed
                    if (data.content !== lastContent) {
                      lastContent = data.content
                      setChatMessages((prev) => {
                        const messages = [...prev]
                        messages[messages.length - 1] = {
                          ...messages[messages.length - 1],
                          role: "system",
                          content: data.content,
                          isStreaming: true,
                          visualization: lastVisualization,
                        }
                        return messages
                      })
                    }
                  } else if (data.type === 'visualization' && data.visualization) {
                    // Store visualization data
                    console.log('Received visualization data:', data.visualization)
                    lastVisualization = data.visualization
                    setChatMessages((prev) => {
                      const messages = [...prev]
                      messages[messages.length - 1] = {
                        ...messages[messages.length - 1],
                        visualization: data.visualization,
                      }
                      return messages
                    })
                  } else if (data.type === 'done') {
                    // Streaming complete
                    console.log('Stream complete with visualization:', lastVisualization)
                    setChatMessages((prev) => {
                      const messages = [...prev]
                      messages[messages.length - 1] = {
                        ...messages[messages.length - 1],
                        role: "system",
                        content: lastContent || "I've completed the analysis.",
                        isStreaming: false,
                        visualization: lastVisualization,
                      }
                      console.log('Final message with viz:', messages[messages.length - 1])
                      return messages
                    })
                  } else if (data.error) {
                    throw new Error(data.error)
                  }
                } catch (parseError) {
                  console.warn('Failed to parse SSE data:', dataStr, parseError)
                }
              }
            }
          }
        }
        
        // Process any remaining buffer
        if (buffer.trim() && buffer.startsWith('data: ')) {
          const dataStr = buffer.slice(6)
          try {
            const data = JSON.parse(dataStr)
            if (data.type === 'content' && data.content) {
              setChatMessages((prev) => {
                const messages = [...prev]
                messages[messages.length - 1] = {
                  role: "system",
                  content: data.content,
                  isStreaming: false,
                }
                return messages
              })
            }
          } catch (e) {
            // Ignore incomplete JSON
          }
        }
      }

      // Mark streaming as complete
      setChatMessages((prev) => {
        const messages = [...prev]
        if (messages[messages.length - 1]?.isStreaming) {
          messages[messages.length - 1] = {
            ...messages[messages.length - 1],
            isStreaming: false,
          }
        }
        return messages
      })
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted')
      } else {
        console.error('Error streaming response:', error)
        setChatMessages((prev) => {
          const messages = [...prev]
          messages[messages.length - 1] = {
            role: "system",
            content: "I encountered an error while processing your request. Please try again.",
            isStreaming: false,
          }
          return messages
        })
      }
    } finally {
      setIsTyping(false)
      abortControllerRef.current = null
    }
  }

  const extractVisualizationFromContent = (content: string): { text: string; visualization: any } => {
    // Check if content contains visualization markers
    if (content.includes('**Pie Chart Data:**')) {
      // Extract pie chart data
      const lines = content.split('\n')
      const data: any[] = []
      let inPieSection = false
      
      for (const line of lines) {
        if (line.includes('**Pie Chart Data:**')) {
          inPieSection = true
        } else if (line.startsWith('•') && inPieSection) {
          const match = line.match(/• (.+): ([\d,]+) \(([\d.]+)%\)/)
          if (match) {
            data.push({
              label: match[1],
              value: parseInt(match[2].replace(/,/g, '')),
              percentage: parseFloat(match[3])
            })
          }
        } else if (line.startsWith('##') || line.startsWith('**') && !line.includes('Pie Chart')) {
          inPieSection = false
        }
      }
      
      if (data.length > 0) {
        return {
          text: content,
          visualization: { type: 'pie', data }
        }
      }
    }

    if (content.includes('**Bar Chart Data:**')) {
      // Extract bar chart data
      const lines = content.split('\n')
      const data: any[] = []
      let inBarSection = false
      
      for (const line of lines) {
        if (line.includes('**Bar Chart Data:**')) {
          inBarSection = true
        } else if (inBarSection && line.includes(':')) {
          const match = line.match(/(.+): .* ([\d,]+)/)
          if (match) {
            data.push({
              label: match[1].trim(),
              value: parseInt(match[2].replace(/,/g, ''))
            })
          }
        }
      }
      
      if (data.length > 0) {
        return {
          text: content,
          visualization: { type: 'bar', data }
        }
      }
    }

    return { text: content, visualization: null }
  }

  const renderMessage = (message: ChatMessage) => {
    // Use visualization data from message if available, otherwise try to extract from content
    const visualizationToRender = message.visualization || extractVisualizationFromContent(message.content).visualization
    console.log('Rendering message with visualization:', visualizationToRender)
    
    return (
      <>
        <div className="whitespace-pre-wrap text-sm">
          {message.role === "system" ? (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown 
                components={{
                h2: ({ children }) => <h2 className="text-lg font-bold mt-2 mb-1 text-purple-400">{children}</h2>,
                h3: ({ children }) => <h3 className="text-md font-semibold mt-2 mb-1 text-blue-400">{children}</h3>,
                strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                li: ({ children }) => <li className="text-slate-300">{children}</li>,
                p: ({ children }) => <p className="my-1">{children}</p>,
                code: ({ children, className }) => {
                  const isBlock = className?.includes('language-')
                  return isBlock ? (
                    <pre className="bg-slate-800 rounded p-2 overflow-x-auto my-2">
                      <code className="text-xs text-green-400">{children}</code>
                    </pre>
                  ) : (
                    <code className="bg-slate-700 px-1 rounded text-xs">{children}</code>
                  )
                },
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="min-w-full text-xs">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="border-b border-slate-600">{children}</thead>,
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr: ({ children }) => <tr className="border-b border-slate-700">{children}</tr>,
                th: ({ children }) => <th className="px-2 py-1 text-left text-purple-400">{children}</th>,
                td: ({ children }) => <td className="px-2 py-1">{children}</td>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-purple-500 pl-3 my-2 italic text-slate-400">
                    {children}
                  </blockquote>
                ),
                details: ({ children }) => (
                  <details className="my-2 bg-slate-800/50 rounded p-2">
                    {children}
                  </details>
                ),
                summary: ({ children }) => (
                  <summary className="cursor-pointer text-purple-400 hover:text-purple-300">
                    {children}
                  </summary>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
            </div>
          ) : (
            message.content
          )}
        </div>
        {visualizationToRender && renderVisualization(visualizationToRender)}
        {message.isStreaming && (
          <div className="flex space-x-1 mt-2">
            <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce"></div>
            <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce delay-100"></div>
            <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce delay-200"></div>
          </div>
        )}
      </>
    )
  }

  const renderVisualization = (visualization: any) => {
    console.log('renderVisualization called with:', visualization)
    if (!visualization) {
      console.log('No visualization data')
      return null
    }

    console.log('Visualization type:', visualization.type)
    switch (visualization.type) {
      case 'pie':
        console.log('Rendering pie chart with data:', visualization.data)
        return (
          <div className="mt-3 bg-slate-800/30 rounded-lg border border-indigo-700/50 p-4">
            <SimplePieChart 
              data={visualization.data.map((item: any) => ({
                label: item.label || 'Unknown',
                value: item.value || 0,
                percentage: item.percentage
              }))}
              size={180}
            />
          </div>
        )
      
      case 'bar':
        console.log('Rendering bar chart with data:', visualization.data)
        const barData = visualization.data.map((item: any) => ({
          country: String(item.label || item.category || item.name || item.owner_name || item[Object.keys(item)[0]] || 'Unknown'),
          value: Number(item.value || item.count || item.total || item.total_value || item.deal_count || item[Object.keys(item)[1]] || 0)
        }))
        console.log('Mapped bar data:', barData)
        return (
          <div className="mt-3 bg-slate-800/30 rounded-lg border border-indigo-700/50 p-3">
            <div className="h-[200px]">
              <BarChart
                color="#3b82f6"
                data={barData}
                minimal={true}
              />
            </div>
          </div>
        )
      
      case 'line':
        console.log('Rendering line chart with data:', visualization.data)
        // Map the data correctly - the backend sends x,y format
        const lineData = visualization.data.map((item: any) => ({
          month: String(item.x || item.label || item.month || item.date || 'Unknown'),
          value: Number(item.y || item.value || item.count || item.total || 0)
        }))
        console.log('Mapped line data:', lineData)
        return (
          <div className="mt-3 bg-slate-800/30 rounded-lg border border-indigo-700/50 p-3">
            <div className="h-[200px]">
              <LineChart
                color="#10b981"
                data={lineData}
                minimal={true}
              />
            </div>
          </div>
        )
      
      case 'table':
        console.log('Rendering table with data:', visualization.data)
        return (
          <div className="mt-3 bg-slate-800/30 rounded-lg border border-indigo-700/50 p-3">
            <SimpleTable 
              data={visualization.data}
              columns={visualization.columns}
            />
          </div>
        )
      
      case 'scatter':
        console.log('Rendering scatter plot with data:', visualization.data)
        // For now, we'll use a line chart without lines for scatter
        return (
          <div className="mt-3 bg-slate-800/30 rounded-lg border border-indigo-700/50 p-3">
            <div className="h-[200px]">
              <LineChart
                color="#f59e0b"
                data={visualization.data.map((item: any) => ({
                  month: String(item.x || item.label || 'Unknown'),
                  value: item.y || item.value || 0
                }))}
                minimal={true}
              />
            </div>
          </div>
        )
      
      default:
        console.log('Unknown visualization type:', visualization.type)
        return null
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 right-6 w-[90vw] sm:w-[450px] z-50"
        >
          <Card className="backdrop-blur-md bg-slate-900/95 border-indigo-700/40 shadow-xl h-[600px] overflow-hidden rounded-2xl">
            <CardHeader className="border-b border-indigo-700/30 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-100 flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-purple-500" />
                  Ask andi
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-slate-800/50 text-purple-400 border-purple-500/50 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mr-1 animate-pulse"></div>
                    LIVE DATA
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-6 w-6 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[calc(100%-60px)]">
              <div className="flex-1 p-4 overflow-auto" ref={chatContainerRef}>
                <div className="space-y-4">
                  {chatMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[90%] rounded-lg p-3 ${
                          message.role === "user" ? "bg-purple-500/20 text-white" : "bg-slate-800/50 text-slate-200"
                        }`}
                      >
                        {renderMessage(message)}
                      </div>
                    </div>
                  ))}
                  {isTyping && !chatMessages[chatMessages.length - 1]?.isStreaming && (
                    <div className="flex justify-start">
                      <div className="max-w-[90%] rounded-lg p-3 bg-slate-800/50 text-slate-200">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce"></div>
                          <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce delay-100"></div>
                          <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-indigo-700/30">
                <form onSubmit={handleChatSubmit} className="flex space-x-2">
                  <input
                    placeholder="Ask about your business data..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isTyping}
                    className="flex-1 bg-slate-800/50 border-indigo-700/30 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                  />
                  <Button
                    type="button"
                    onClick={toggleListening}
                    disabled={isTyping}
                    className={`${isListening ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"} disabled:opacity-50`}
                  >
                    <Mic className={`h-4 w-4 ${isListening ? "animate-pulse" : ""}`} />
                  </Button>
                  <Button type="submit" disabled={isTyping} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}