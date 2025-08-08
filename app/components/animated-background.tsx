"use client"

import { useEffect, useRef } from "react"

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Global breathing effect variables
    let globalBreathPhase = 0
    const globalBreathSpeed = 0.005 // Slightly faster breathing

    // Create large cloud-like gradients
    class CloudGlow {
      x: number
      y: number
      radius: number
      baseAlpha: number
      color: string
      hue: number
      hueShift: number
      saturation: number
      lightness: number
      pulseSpeed: number
      pulseAmount: number
      currentPulse: number

      constructor(x: number, y: number, radius: number, hueRange: { min: number; max: number }, options: any = {}) {
        this.x = x
        this.y = y
        this.radius = radius
        this.hue = Math.random() * (hueRange.max - hueRange.min) + hueRange.min
        this.hueShift = (Math.random() * 0.2 - 0.1) * (options.hueShiftFactor || 1)
        this.baseAlpha = options.alpha || 0.2 + Math.random() * 0.1
        this.saturation = options.saturation || 70
        this.lightness = options.lightness || 50
        this.pulseSpeed = 0.005 + Math.random() * 0.005
        this.pulseAmount = 0.1 + Math.random() * 0.1
        this.currentPulse = Math.random() * Math.PI * 2
        this.color = this.getColor(this.baseAlpha)
      }

      getColor(alpha: number) {
        return `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${alpha})`
      }

      update(globalIntensity: number) {
        // Shift hue slowly
        this.hue += this.hueShift

        // Pulse size
        this.currentPulse += this.pulseSpeed
        const pulseFactor = 1 + Math.sin(this.currentPulse) * this.pulseAmount

        // Apply global breathing to alpha
        const currentAlpha = this.baseAlpha * globalIntensity

        // Update color with current alpha
        this.color = this.getColor(currentAlpha)

        return { pulseFactor, currentAlpha }
      }

      draw(pulseFactor: number, currentAlpha: number) {
        const pulseRadius = this.radius * pulseFactor

        // Create a large, soft gradient
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, pulseRadius)

        gradient.addColorStop(0, this.color)
        gradient.addColorStop(
          0.6,
          `hsla(${this.hue}, ${this.saturation}%, ${this.lightness - 10}%, ${currentAlpha * 0.5})`,
        )
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

        ctx.beginPath()
        ctx.arc(this.x, this.y, pulseRadius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      }
    }

    // Create a few large cloud glows
    const clouds: CloudGlow[] = []

    // Position main clouds around the edges (purple/blue range)
    clouds.push(new CloudGlow(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.4, { min: 240, max: 280 }))
    clouds.push(new CloudGlow(canvas.width * 0.8, canvas.height * 0.2, canvas.width * 0.4, { min: 250, max: 290 }))
    clouds.push(new CloudGlow(canvas.width * 0.2, canvas.height * 0.8, canvas.width * 0.4, { min: 260, max: 300 }))
    clouds.push(new CloudGlow(canvas.width * 0.8, canvas.height * 0.8, canvas.width * 0.4, { min: 270, max: 310 }))

    // Add accent clouds with complementary colors

    // Deep purple accent
    clouds.push(
      new CloudGlow(
        canvas.width * 0.3,
        canvas.height * 0.6,
        canvas.width * 0.25,
        { min: 270, max: 290 },
        { alpha: 0.15, saturation: 85, lightness: 40 },
      ),
    )

    // Neon pink/magenta accent
    clouds.push(
      new CloudGlow(
        canvas.width * 0.7,
        canvas.height * 0.3,
        canvas.width * 0.2,
        { min: 300, max: 330 },
        { alpha: 0.15, saturation: 90, lightness: 60 },
      ),
    )

    // Electric blue accent
    clouds.push(
      new CloudGlow(
        canvas.width * 0.5,
        canvas.height * 0.9,
        canvas.width * 0.3,
        { min: 190, max: 210 },
        { alpha: 0.13, saturation: 90, lightness: 55 },
      ),
    )

    // Indigo accent
    clouds.push(
      new CloudGlow(
        canvas.width * 0.9,
        canvas.height * 0.7,
        canvas.width * 0.3,
        { min: 230, max: 250 },
        { alpha: 0.14, saturation: 80, lightness: 45 },
      ),
    )

    // Animation loop
    const animate = () => {
      // Update global breathing phase
      globalBreathPhase += globalBreathSpeed

      // Calculate global intensity (0 to 1) using sine wave for smooth breathing
      // Using sine wave shifted to be between 0 and 1 instead of -1 and 1
      const globalIntensity = (Math.sin(globalBreathPhase) + 1) / 2

      // Clear canvas completely each frame for clean animation
      ctx.fillStyle = "rgba(0, 0, 0, 1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw clouds with global intensity
      for (const cloud of clouds) {
        const { pulseFactor, currentAlpha } = cloud.update(globalIntensity)
        cloud.draw(pulseFactor, currentAlpha)
      }

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 bg-black" />
    </div>
  )
}

