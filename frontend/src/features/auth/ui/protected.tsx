"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { makeAuthController } from "../../../di/make-auth-controller"

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
        // Check for development bypass flag
        const authBypass = process.env.NEXT_PUBLIC_AUTH_BYPASS === "1"
        
        if (authBypass) {
          console.log("🚧 Auth bypass enabled - skipping authentication checks")
          setIsAuthenticated(true)
          setIsChecking(false)
          return
        }

        const authController = makeAuthController()
        const authed = authController.isAuthenticated()

        if (!authed) {
          router.replace("/login")
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error("Auth check error:", error)
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

  // User is authenticated or bypass is enabled, render the protected content
  return <>{children}</>
}
