"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Brain, ArrowRight, Loader2 } from "lucide-react"
import AnimatedBackground from "../components/animated-background"
import LoadingScreen from "../components/loading-screen"
import { login } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState("Email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await login(email, password)
      setIsLoading(false)
      setIsLoggedIn(true)
    } catch (err: any) {
      setIsLoading(false)
      setError(err?.message || "Login failed")
    }
  }

  // Immediately redirect on successful login, skip loading screen
  if (isLoggedIn) {
    sessionStorage.setItem("fromLogin", "true")
    router.push("/")
    return null
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-md mx-auto bg-[#0c0c14]/80 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden">
        <div className="flex flex-col items-center justify-center pt-10 pb-6">
          <div className="rounded-full bg-black/40 p-5 mb-5 border border-gray-800/50">
            <Brain className="h-12 w-12 text-purple-400" />
          </div>

          <h1 className="text-3xl font-bold mb-2 text-center">
            <span
              className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
              style={{
                animation: "gradient 8s linear infinite",
                backgroundSize: "300% 100%",
                backgroundPosition: "left",
              }}
            >
              Let&apos;s meet andi!
            </span>
          </h1>
          <p className="text-base text-gray-400 text-center">Adaptive Neural Data Intelligence</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800/50">
          {["Email", "SSO", "Providers"].map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === tab ? "text-white bg-gray-800/30" : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "Email" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm text-gray-400">Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full py-2 pl-10 pr-3 bg-gray-900/50 border border-gray-800 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="block text-sm text-gray-400">Password</label>
                  <a href="#" className="text-xs text-purple-400 hover:text-purple-300">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <input
                    type="password"
                    placeholder="••••••"
                    className="w-full py-2 pl-10 pr-3 bg-gray-900/50 border border-gray-800 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <div className="text-sm text-red-400">{error}</div>}

              <button
                type="submit"
                className="w-full flex items-center justify-center py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === "SSO" && (
            <div className="py-8 text-center text-gray-400">
              <p>Single Sign-On authentication option</p>
              <button
                onClick={handleLogin}
                className="mt-4 w-full flex items-center justify-center py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
              >
                Continue with SSO
              </button>
            </div>
          )}

          {activeTab === "Providers" && (
            <div className="py-8 text-center text-gray-400">
              <p>Third-party authentication providers</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={handleLogin}
                  className="flex items-center justify-center py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                    </g>
                  </svg>
                  Google
                </button>
                <button
                  onClick={handleLogin}
                  className="flex items-center justify-center py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z"
                      fill="#4285F4"
                    />
                  </svg>
                  Microsoft
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-400">
              Don&apos;t have an account?{" "}
              <a href="/register" className="text-purple-400 hover:text-purple-300">
                Request access
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-8 text-center text-sm text-gray-500">
        <p>© 2025 Zamora AI. All rights reserved.</p>
      </div>
    </div>
  )
}

