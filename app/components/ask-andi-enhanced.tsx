"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Brain, FileText, PieChart, Mic, X, Upload, Sparkles, Bot } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LineChart } from "./line-chart"
import { BarChart } from "./bar-chart"
import { motion, AnimatePresence } from "framer-motion"
import { apiClient } from "@/lib/api"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  attachment?: "chart" | "report" | "pie" | "bar" | null
  actions?: AgentAction[]
  confidence?: number
}

interface AgentAction {
  type: 'automation' | 'alert' | 'recommendation'
  title: string
  description: string
  impact: string
  requiresApproval: boolean
  actionData?: any
}

interface AskAndiEnhancedProps {
  isOpen: boolean
  onClose: () => void
}

export function AskAndiEnhanced({ isOpen, onClose }: AskAndiEnhancedProps) {
  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I'm ANDI, your AI-powered business intelligence assistant. I provide role-specific insights and recommendations. How can I help you today?",
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [suggestedActions, setSuggestedActions] = useState<AgentAction[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  // Load suggested actions on mount
  useEffect(() => {
    loadSuggestedActions()
  }, [])

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

  const loadSuggestedActions = async () => {
    try {
      const response = await apiClient.get('/api/ai/suggested-actions')
      if (response.success && response.actions) {
        setSuggestedActions(response.actions)
      }
    } catch (error) {
      console.error('Failed to load suggested actions:', error)
    }
  }

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setChatInput(`Analyze this ${file.type.includes('pdf') ? 'document' : 'file'}: ${file.name}`)
    }
  }

  const executeAction = async (action: AgentAction) => {
    if (action.requiresApproval) {
      const confirmed = window.confirm(`This action requires approval:\n\n${action.title}\n${action.description}\n\nExpected Impact: ${action.impact}\n\nDo you want to proceed?`)
      if (!confirmed) return
    }

    // Add execution message
    setChatMessages(prev => [...prev, {
      role: "assistant",
      content: `Executing: ${action.title}\n\nThis action is now in progress. You'll be notified when it's complete.`,
    }])

    // Here you would actually execute the action via API
    console.log('Executing action:', action)
  }

  // Handle chat input
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput,
    }
    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setIsTyping(true)

    try {
      // Call the enhanced AI API
      const response = await apiClient.post('/api/ai/chat', {
        query: chatInput,
        conversationId: conversationId,
      })

      if (response.success && response.response) {
        const aiResponse = response.response
        
        // Set conversation ID if not already set
        if (!conversationId && response.conversationId) {
          setConversationId(response.conversationId)
        }

        // Add AI response with enhanced features
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: aiResponse.content,
          actions: aiResponse.actions,
          confidence: aiResponse.confidence,
          attachment: detectAttachmentType(aiResponse.content),
        }

        setChatMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('AI chat error:', error)
      setChatMessages((prev) => [...prev, {
        role: "assistant",
        content: "I encountered an error processing your request. Please ensure the backend AI service is configured with an OpenAI API key.",
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const detectAttachmentType = (content: string): ChatMessage['attachment'] => {
    const lower = content.toLowerCase()
    if (lower.includes('chart') || lower.includes('trend')) return 'chart'
    if (lower.includes('report') || lower.includes('document')) return 'report'
    if (lower.includes('distribution') || lower.includes('segment')) return 'pie'
    if (lower.includes('comparison') || lower.includes('breakdown')) return 'bar'
    return null
  }

  const renderAction = (action: AgentAction, index: number) => {
    const typeColors = {
      automation: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      alert: 'bg-red-500/20 text-red-400 border-red-500/50',
      recommendation: 'bg-green-500/20 text-green-400 border-green-500/50',
    }

    const typeIcons = {
      automation: '⚡',
      alert: '🚨',
      recommendation: '💡',
    }

    return (
      <div key={index} className={`mt-2 p-3 rounded-lg border ${typeColors[action.type]}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{typeIcons[action.type]}</span>
              <span className="font-semibold">{action.title}</span>
              {action.requiresApproval && (
                <Badge variant="outline" className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/50">
                  Requires Approval
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-300 mb-1">{action.description}</p>
            <p className="text-xs text-slate-400">Impact: {action.impact}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => executeAction(action)}
            className="ml-2 text-xs"
          >
            Execute
          </Button>
        </div>
      </div>
    )
  }

  const renderAttachment = (type: "chart" | "report" | "pie" | "bar" | null) => {
    switch (type) {
      case "chart":
        return (
          <div className="mt-2 bg-slate-800/30 rounded-lg border border-indigo-700/50 p-3">
            <div className="h-[150px]">
              <LineChart
                color="#c44ed9"
                data={[
                  { month: "JAN", value: 100 },
                  { month: "FEB", value: 115 },
                  { month: "MAR", value: 108 },
                  { month: "APR", value: 125 },
                  { month: "MAY", value: 142 },
                  { month: "JUN", value: 158 },
                ]}
              />
            </div>
            <div className="text-xs text-center mt-2 text-slate-400">AI-Generated Forecast</div>
          </div>
        )
      case "bar":
        return (
          <div className="mt-2 bg-slate-800/30 rounded-lg border border-indigo-700/50 p-3">
            <div className="h-[150px]">
              <BarChart
                color="#3b82f6"
                data={[
                  { country: "Product A", value: 45 },
                  { country: "Product B", value: 35 },
                  { country: "Product C", value: 65 },
                  { country: "Product D", value: 30 },
                  { country: "Product E", value: 25 },
                ]}
              />
            </div>
            <div className="text-xs text-center mt-2 text-slate-400">Performance Breakdown</div>
          </div>
        )
      case "report":
        return (
          <div className="mt-2 bg-slate-800/30 rounded-lg border border-indigo-700/50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-400 mr-2" />
                <div>
                  <div className="text-sm font-medium text-white">AI_Analysis_Report.pdf</div>
                  <div className="text-xs text-slate-400">Generated just now</div>
                </div>
              </div>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Download
              </Button>
            </div>
          </div>
        )
      case "pie":
        return (
          <div className="mt-2 bg-slate-800/30 rounded-lg border border-indigo-700/50 p-3">
            <div className="flex justify-center">
              <div className="relative h-[150px] w-[150px]">
                <div className="absolute inset-0 rounded-full border-8 border-purple-500 opacity-20"></div>
                <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-purple-500 border-r-purple-500 border-b-purple-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <PieChart className="h-8 w-8 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="text-xs text-center mt-2 text-slate-400">Segment Analysis</div>
          </div>
        )
      default:
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
          <Card className="backdrop-blur-md bg-slate-900/90 border-indigo-700/40 shadow-xl h-[600px] overflow-hidden rounded-2xl">
            <CardHeader className="border-b border-indigo-700/30 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-100 flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-purple-500" />
                  Ask andi - AI Assistant
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-slate-800/50 text-purple-400 border-purple-500/50 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mr-1 animate-pulse"></div>
                    GPT-4 ENHANCED
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
              {/* Suggested Actions Bar */}
              {suggestedActions.length > 0 && chatMessages.length === 1 && (
                <div className="p-3 border-b border-indigo-700/30 bg-slate-800/30">
                  <div className="text-xs text-slate-400 mb-2 flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Suggested Actions for Your Role
                  </div>
                  <div className="flex gap-2 overflow-x-auto">
                    {suggestedActions.slice(0, 3).map((action, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant="outline"
                        className="text-xs whitespace-nowrap"
                        onClick={() => executeAction(action)}
                      >
                        {action.title}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 p-4 overflow-auto" ref={chatContainerRef}>
                <div className="space-y-4">
                  {chatMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[90%] rounded-lg p-3 ${
                          message.role === "user" ? "bg-purple-500/20 text-white" : "bg-slate-800/50 text-slate-200"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="flex items-center gap-2 mb-2">
                            <Bot className="h-4 w-4 text-purple-400" />
                            <span className="text-xs text-purple-400">AI Assistant</span>
                            {message.confidence && (
                              <Badge variant="outline" className="text-xs">
                                {Math.round(message.confidence * 100)}% confident
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="whitespace-pre-line text-sm">{message.content}</div>
                        {message.attachment && renderAttachment(message.attachment)}
                        {message.actions && message.actions.map((action, idx) => renderAction(action, idx))}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="max-w-[90%] rounded-lg p-3 bg-slate-800/50 text-slate-200">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-purple-400 animate-pulse" />
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce"></div>
                            <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce delay-100"></div>
                            <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce delay-200"></div>
                          </div>
                          <span className="text-xs text-slate-400">Analyzing with AI...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-indigo-700/30">
                <div className="flex items-center gap-2 mb-2">
                  {uploadedFile && (
                    <Badge variant="outline" className="text-xs">
                      📎 {uploadedFile.name}
                    </Badge>
                  )}
                </div>
                <form onSubmit={handleChatSubmit} className="flex space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="icon"
                    className="bg-slate-800/50 border-indigo-700/30"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <input
                    placeholder="Ask anything... (role-specific insights)"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-slate-800/50 border-indigo-700/30 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <Button
                    type="button"
                    onClick={toggleListening}
                    className={`${isListening ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    <Mic className={`h-4 w-4 ${isListening ? "animate-pulse" : ""}`} />
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
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