"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Send, 
  Bot, 
  User, 
  Sparkles,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  RefreshCw,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  widget?: any
  insights?: any[]
  suggestedQuestions?: string[]
}

interface ChatAssistantProps {
  onClose?: () => void
  onWidgetGenerated?: (widget: any) => void
  initialMessage?: string
}

export function AIChatAssistant({ onClose, onWidgetGenerated, initialMessage }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "Show me revenue trends for this month",
    "What are my top performing products?",
    "Generate a forecast for next quarter",
    "Identify at-risk deals",
    "Create a dashboard for sales team"
  ])
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Add welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your AI assistant. I can help you analyze data, generate insights, create widgets, and answer questions about your business. What would you like to know?",
      timestamp: new Date(),
      suggestedQuestions: suggestedQuestions
    }])

    // If there's an initial message, process it
    if (initialMessage) {
      setTimeout(() => {
        handleSendMessage(initialMessage)
      }, 500)
    }
  }, [])

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await apiFetch<{
        success: boolean
        response: {
          message: string
          widget?: any
          relatedInsights?: any[]
          suggestedQuestions?: string[]
        }
      }>('/api/insights/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          message: text,
          context: messages.slice(-5) // Send last 5 messages for context
        })
      })

      if (response?.response) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.response.message,
          timestamp: new Date(),
          widget: response.response.widget,
          insights: response.response.relatedInsights,
          suggestedQuestions: response.response.suggestedQuestions
        }

        setMessages(prev => [...prev, assistantMessage])

        // Update suggested questions
        if (response.response.suggestedQuestions) {
          setSuggestedQuestions(response.response.suggestedQuestions)
        }

        // If a widget was generated, notify parent
        if (response.response.widget && onWidgetGenerated) {
          onWidgetGenerated(response.response.widget)
        }
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I encountered an error: ${error?.message || 'Failed to process your request'}. Please try again.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuestionClick = (question: string) => {
    setInput(question)
    handleSendMessage(question)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case 'line':
        return <LineChart className="h-4 w-4" />
      case 'bar':
        return <BarChart3 className="h-4 w-4" />
      case 'pie':
        return <PieChart className="h-4 w-4" />
      default:
        return <TrendingUp className="h-4 w-4" />
    }
  }

  const renderWidget = (widget: any) => {
    return (
      <Card className="mt-2 mb-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{widget.title}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {getVisualizationIcon(widget.visualization?.type)}
              <span className="ml-1">{widget.visualization?.type}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {widget.description && (
            <p className="text-xs text-muted-foreground mb-2">{widget.description}</p>
          )}
          
          {widget.visualization?.type === 'number' && widget.visualization.data ? (
            <div className="text-center py-4">
              <div className="text-2xl font-bold">
                {widget.visualization.data.value?.toLocaleString() || '0'}
              </div>
              {widget.visualization.data.formatted && (
                <p className="text-xs text-muted-foreground mt-1">
                  {widget.visualization.data.formatted}
                </p>
              )}
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center bg-muted rounded">
              <p className="text-xs text-muted-foreground">
                Widget visualization ready
              </p>
            </div>
          )}
          
          {widget.actions && widget.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {widget.actions.map((action: any, idx: number) => (
                <Button key={idx} size="sm" variant="outline" className="text-xs">
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderInsight = (insight: any) => {
    return (
      <Alert key={insight.id} className="mt-2">
        <AlertDescription>
          <div className="font-medium text-sm mb-1">{insight.title}</div>
          <p className="text-xs text-muted-foreground">{insight.description}</p>
          {insight.metric && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-bold">
                {insight.metric.value?.toLocaleString()}
              </span>
              <Badge variant={insight.metric.change > 0 ? "default" : "secondary"} className="text-xs">
                {insight.metric.change > 0 ? '+' : ''}{insight.metric.changePercent?.toFixed(1)}%
              </Badge>
            </div>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (isMinimized) {
    return (
      <Card className="fixed bottom-4 right-4 w-80 shadow-xl z-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">AI Assistant</CardTitle>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(false)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              {onClose && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] shadow-xl z-50 flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">AI Assistant</CardTitle>
            <Badge variant="outline" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Powered by AI
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
        <div className="py-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={cn(
                "max-w-[80%] space-y-2",
                message.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "rounded-lg px-3 py-2",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                )}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>

                {message.widget && renderWidget(message.widget)}
                
                {message.insights && message.insights.map(insight => renderInsight(insight))}
                
                {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Suggested questions:</p>
                    {message.suggestedQuestions.map((question, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="text-xs text-left justify-start h-auto py-1 px-2 w-full"
                        onClick={() => handleQuestionClick(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {message.role === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        {suggestedQuestions.length > 0 && messages.length === 1 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-1">
              {suggestedQuestions.slice(0, 3).map((question, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleQuestionClick(question)}
                >
                  {question.slice(0, 30)}...
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your data..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Floating button to open the chat
export function AIChatButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-lg z-40"
      size="icon"
    >
      <Bot className="h-6 w-6" />
    </Button>
  )
}