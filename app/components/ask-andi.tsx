"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Brain, FileText, PieChart, Mic, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LineChart } from "./line-chart"
import { BarChart } from "./bar-chart"
import { motion, AnimatePresence } from "framer-motion"

interface ChatMessage {
  role: "user" | "system"
  content: string
  attachment?: "chart" | "report" | "pie" | "bar" | null
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
      content: "Hello! I'm ANDI, your Adaptive Neural Data Intelligence assistant. How can I help you today?",
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

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
  const handleChatSubmit = (e: React.FormEvent) => {
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

    // Simulate AI response
    setTimeout(() => {
      let response: ChatMessage = {
        role: "system",
        content: "I'm analyzing your request...",
      }

      if (chatInput.toLowerCase().includes("sales") && chatInput.toLowerCase().includes("down")) {
        response = {
          role: "system",
          content:
            "Based on my analysis, sales are down 12% this quarter primarily due to three factors:\n\n" +
            "1. Seasonal fluctuations (contributing ~40% of the decline)\n" +
            "2. Increased competitor activity in your core markets (contributing ~35%)\n" +
            "3. Supply chain disruptions affecting product availability (contributing ~25%)\n\n" +
            "I've prepared a sales trend chart for the last 6 months:",
          attachment: "chart",
        }
      } else if (
        chatInput.toLowerCase().includes("increase") &&
        (chatInput.toLowerCase().includes("revenue") || chatInput.toLowerCase().includes("sales"))
      ) {
        response = {
          role: "system",
          content:
            "To increase revenue, I recommend these data-driven actions:\n\n" +
            "1. Implement targeted promotions for your top 20% customers who haven't purchased in 30+ days\n" +
            "2. Optimize pricing for products with high elasticity - I've identified 5 products with potential for 5-8% price increases\n" +
            "3. Reallocate $15,000 from underperforming marketing channels to high-ROI campaigns\n\n" +
            "Here's a breakdown of revenue opportunities by channel:",
          attachment: "bar",
        }
      } else if (chatInput.toLowerCase().includes("report") || chatInput.toLowerCase().includes("generate")) {
        response = {
          role: "system",
          content:
            "I've generated a comprehensive sales performance report for Q2 2023. Key findings include:\n\n" +
            "• Overall revenue increased by 8.2% compared to Q1\n" +
            "• Customer acquisition cost decreased by 12%\n" +
            "• Product category A showed the strongest growth at 15%\n" +
            "• Geographic region East underperformed with a 3% decline\n\n" +
            "The full report is available for download.",
          attachment: "report",
        }
      } else if (chatInput.toLowerCase().includes("customer") && chatInput.toLowerCase().includes("segment")) {
        response = {
          role: "system",
          content:
            "I've analyzed your customer segments and identified 4 distinct groups:\n\n" +
            "• Premium Loyalists (18%): High-value, frequent purchasers\n" +
            "• Value Seekers (42%): Price-sensitive, occasional buyers\n" +
            "• New Explorers (24%): Recent customers still exploring your offerings\n" +
            "• At-Risk (16%): Showing declining engagement patterns\n\n" +
            "Here's the customer segment distribution:",
          attachment: "pie",
        }
      } else {
        response = {
          role: "system",
          content:
            "I've analyzed your question and can provide insights based on your business data. Would you like me to generate a report, suggest actions, or provide more specific analysis on this topic?",
        }
      }

      setChatMessages((prev) => [...prev, response])
      setIsTyping(false)
    }, 1500)
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
                  { month: "FEB", value: 85 },
                  { month: "MAR", value: 90 },
                  { month: "APR", value: 75 },
                  { month: "MAY", value: 65 },
                  { month: "JUN", value: 60 },
                ]}
              />
            </div>
            <div className="text-xs text-center mt-2 text-slate-400">Sales Trend (Last 6 Months)</div>
            <div className="mt-3 pt-2 border-t border-indigo-700/30">
              <div className="text-xs text-slate-400 mb-2">
                <span className="font-medium text-purple-400">Quick Insight:</span> Sales decline accelerated in
                May-June
              </div>
              <div className="text-xs text-slate-400 mb-2 flex items-start">
                <span className="font-medium text-green-400 mr-1">AI Recommendation:</span>
                <span>Launch targeted promotion to top 20% customers to reverse trend within 30 days</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs bg-slate-800/50 border-indigo-700/30 text-slate-200 hover:bg-slate-700/50"
              >
                Get Detailed Analysis
              </Button>
            </div>
          </div>
        )
      case "bar":
        return (
          <div className="mt-2 bg-slate-800/30 rounded-lg border border-indigo-700/50 p-3">
            <div className="h-[150px]">
              <BarChart
                color="#3b82f6"
                data={[
                  { country: "Email", value: 45 },
                  { country: "Social", value: 25 },
                  { country: "Search", value: 65 },
                  { country: "Direct", value: 30 },
                  { country: "Affiliate", value: 15 },
                ]}
              />
            </div>
            <div className="text-xs text-center mt-2 text-slate-400">Revenue Opportunity by Channel ($K)</div>
            <div className="mt-3 pt-2 border-t border-indigo-700/30">
              <div className="text-xs text-slate-400 mb-2">
                <span className="font-medium text-blue-400">Quick Insight:</span> Search channel offers highest ROI
                potential
              </div>
              <div className="text-xs text-slate-400 mb-2 flex items-start">
                <span className="font-medium text-green-400 mr-1">AI Recommendation:</span>
                <span>Shift 30% of social budget to search for estimated 42% ROI increase</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs bg-slate-800/50 border-indigo-700/30 text-slate-200 hover:bg-slate-700/50"
              >
                Create Action Plan
              </Button>
            </div>
          </div>
        )
      case "report":
        return (
          <div className="mt-2 bg-slate-800/30 rounded-lg border border-indigo-700/50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-400 mr-2" />
                <div>
                  <div className="text-sm font-medium text-white">Q2_2023_Sales_Performance.pdf</div>
                  <div className="text-xs text-slate-400">Generated today at 10:45 AM</div>
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
                {/* Simple pie chart visualization */}
                <div className="absolute inset-0 rounded-full border-8 border-purple-500 opacity-20"></div>
                <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-purple-500 border-r-purple-500 border-b-purple-500"></div>
                <div
                  className="absolute inset-0 rounded-full border-8 border-transparent border-t-blue-500 border-r-blue-500"
                  style={{ clipPath: "polygon(50% 0, 100% 0, 100% 50%, 50% 50%)" }}
                ></div>
                <div
                  className="absolute inset-0 rounded-full border-8 border-transparent border-t-teal-500"
                  style={{ clipPath: "polygon(50% 0, 75% 0, 50% 50%)" }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <PieChart className="h-8 w-8 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="text-xs text-center mt-2 text-slate-400">Customer Segment Distribution</div>
            <div className="flex justify-center mt-2 space-x-3 text-xs">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-purple-500 rounded-full mr-1"></div>
                <span>Premium</span>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 bg-blue-500 rounded-full mr-1"></div>
                <span>Value</span>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 bg-teal-500 rounded-full mr-1"></div>
                <span>New</span>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 bg-amber-500 rounded-full mr-1"></div>
                <span>At-Risk</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-indigo-700/30">
              <div className="text-xs text-slate-400 mb-2">
                <span className="font-medium text-purple-400">Quick Insight:</span> Value Seekers segment growing
                fastest
              </div>
              <div className="text-xs text-slate-400 mb-2 flex items-start">
                <span className="font-medium text-green-400 mr-1">AI Recommendation:</span>
                <span>Create tiered loyalty program to convert Value Seekers to Premium (est. 18% conversion)</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs bg-slate-800/50 border-indigo-700/30 text-slate-200 hover:bg-slate-700/50"
              >
                Target This Segment
              </Button>
            </div>
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
          className="fixed bottom-20 right-6 w-[90vw] sm:w-[400px] z-50"
        >
          <Card className="backdrop-blur-md bg-slate-900/80 border-indigo-700/40 shadow-xl h-[500px] overflow-hidden rounded-2xl">
            <CardHeader className="border-b border-indigo-700/30 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-100 flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-purple-500" />
                  Ask andi
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-slate-800/50 text-purple-400 border-purple-500/50 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mr-1 animate-pulse"></div>
                    ONLINE
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
                        <div className="whitespace-pre-line text-sm">{message.content}</div>
                        {message.attachment && renderAttachment(message.attachment)}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
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
                    placeholder="Ask ANDI anything..."
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

