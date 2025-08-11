"use client"

import { useRouter } from "next/navigation"
import { clearAuthToken } from "@/lib/api"

export function useLogout() {
  const router = useRouter()

  const handleLogout = () => {
    console.log('Executing logout...')
    
    // Clear all auth data
    if (typeof window !== 'undefined') {
      // Clear auth token
      localStorage.removeItem('andi_token')
      localStorage.removeItem('andi_user')
      sessionStorage.removeItem('fromLogin')
      
      console.log('Auth data cleared, redirecting...')
      
      // Use Next.js router for navigation
      router.push('/login')
    }
  }

  return handleLogout
}