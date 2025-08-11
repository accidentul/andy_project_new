"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Clear all auth data
    console.log('Logout page - clearing auth data')
    
    try {
      localStorage.removeItem('andi_token')
      localStorage.removeItem('andi_user')
      sessionStorage.removeItem('fromLogin')
      sessionStorage.clear()
      localStorage.clear()
      
      console.log('Auth data cleared')
    } catch (error) {
      console.error('Error clearing auth data:', error)
    }

    // Redirect to login after a short delay
    setTimeout(() => {
      console.log('Redirecting to login...')
      router.push('/login')
    }, 1000)
  }, [router])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1>Logging out...</h1>
      <p>You are being logged out. Please wait...</p>
      <div style={{ marginTop: '20px' }}>
        <a 
          href="/login" 
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          Click here if not redirected
        </a>
      </div>
    </div>
  )
}