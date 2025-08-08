"use client"

import { useEffect, useState } from "react"
import { Brain } from "lucide-react"
import AnimatedBackground from "./animated-background"

interface LoadingScreenProps {
  onLoadComplete: () => void
}

export default function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 5

        if (newProgress >= 100) {
          clearInterval(interval)

          // Add a small delay before completing
          setTimeout(() => {
            onLoadComplete()
          }, 500)

          return 100
        }

        return newProgress
      })
    }, 200)

    return () => clearInterval(interval)
  }, [onLoadComplete])

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="rounded-full bg-black/40 p-4 mb-6 border border-purple-800/50">
          <Brain className="h-8 w-8 text-purple-400" />
        </div>

        <h1 className="text-2xl font-medium mb-6 text-center">
          <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            Waking up andi...
          </span>
        </h1>

        {/* Progress Bar */}
        <div className="w-64 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

