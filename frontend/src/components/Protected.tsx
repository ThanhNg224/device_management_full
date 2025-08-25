"use client"

import React from "react"
import { useRouter } from "next/navigation"

interface ProtectedProps {
  children: React.ReactNode
}

export function Protected({ children }: ProtectedProps) {
  const router = useRouter()
  const [isChecking, setIsChecking] = React.useState(true)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)

  React.useEffect(() => {
    const checkAuth = () => {
      try {
        const accessToken = localStorage.getItem("accessToken")
        
        if (!accessToken) {
          // No token, redirect to login
          router.replace("/login")
          return
        }

        // Basic token validation (check if it's not just an empty string)
        if (accessToken.trim().length === 0) {
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
          localStorage.removeItem("user")
          router.replace("/login")
          return
        }

        // Token exists and is not empty, consider user authenticated
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Auth check error:", error)
        // If localStorage access fails, clear everything and redirect
        try {
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
          localStorage.removeItem("user")
        } catch {
          // Ignore cleanup errors
        }
        router.replace("/login")
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router])

  // Show nothing while checking authentication
  if (isChecking) {
    return null
  }

  // Show nothing if not authenticated (user will be redirected)
  if (!isAuthenticated) {
    return null
  }

  // User is authenticated, render the protected content
  return <>{children}</>
}
