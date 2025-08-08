"use client"

import { useState } from "react"
import { Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { AskAndi } from "./ask-andi"

export function AskAndiButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <motion.div className="fixed bottom-6 right-6 z-50" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 md:h-14 px-3 md:px-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg hover:shadow-purple-500/20 border border-purple-500/30 flex items-center gap-2"
        >
          <Brain className="h-5 w-5 md:h-6 md:w-6" />
          <span className="font-medium text-sm md:text-base hidden sm:inline">Ask ANDI Anything</span>
          <span className="font-medium text-sm sm:hidden">Ask ANDI</span>
        </Button>
      </motion.div>

      <AskAndi isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

