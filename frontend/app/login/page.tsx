"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { LogIn, Eye, EyeOff, Shield, Users, Monitor } from "lucide-react"
import Image from "next/image"
import "./login.css"

interface LoginResponse {
  accessToken: string
  refreshToken?: string
  user: {
    id: string
    username: string
    displayName: string
    role: "admin" | "user"
  }
}

export default function LoginPage() {
  const router = useRouter()
  
  const [formData, setFormData] = React.useState({
    username: "",
    password: ""
  })
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)

  // Redirect if already logged in
  React.useEffect(() => {
    const accessToken = localStorage.getItem("accessToken")
    if (accessToken) {
      router.replace("/")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Build API URL from environment variable or fallback
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.222:4000"
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      })

      if (response.ok) {
        const data: LoginResponse = await response.json()
        
        // Store tokens in localStorage
        localStorage.setItem("accessToken", data.accessToken)
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken)
        }
        
        // Store user info
        localStorage.setItem("user", JSON.stringify(data.user))
        
        // Redirect to dashboard
        router.replace("/")
      } else {
        // Handle error response
        let errorMessage = "Login failed"
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        
        setError(errorMessage)
      }
    } catch (err) {
      console.error("Login error:", err)
      const errorMessage = err instanceof Error ? err.message : "Network error occurred"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: "username" | "password") => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Welcome section with gradient background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent" />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm p-3">
              <Image
                src="/logo.png"
                alt="Device Manager Logo"
                width={72}
                height={72}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Device Manager</h1>
              <p className="text-blue-100 text-lg">Control & Monitor</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-white leading-tight">
                Welcome back to your
                <span className="block text-blue-200">Device Dashboard</span>
              </h2>
              <p className="text-blue-100 text-lg leading-relaxed">
                Manage your devices, monitor performance, and deploy updates with ease. 
                Your comprehensive device management solution.
              </p>
            </div>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-1 gap-4 mt-12">
              <div className="flex items-center space-x-3 text-blue-100">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Shield className="w-4 h-4" />
                </div>
                <span>Secure device management</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-100">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Monitor className="w-4 h-4" />
                </div>
                <span>Real-time monitoring</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-100">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Users className="w-4 h-4" />
                </div>
                <span>Multi-user access control</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom decoration */}
        <div className="relative z-10 text-blue-200 text-sm">
          © 2025 Device Manager. Secure & Reliable.
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse-slow" />
        <div className="absolute bottom-40 right-32 w-20 h-20 bg-blue-400/20 rounded-full blur-lg animate-float" />
        <div className="absolute top-1/2 right-10 w-16 h-16 bg-indigo-400/10 rounded-full blur-md animate-pulse-slow" />
        
        {/* Subtle logo watermark */}
        <div className="absolute bottom-24 right-12 opacity-15">
          <Image
            src="/logo.png"
            alt=""
            width={160}
            height={160}
            className="object-contain"
          />
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-blue-600 rounded-xl flex items-center justify-center p-3">
                <Image
                  src="/logo.png"
                  alt="Device Manager Logo"
                  width={56}
                  height={56}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Device Manager</h1>
                <p className="text-gray-600 text-lg">Control & Monitor</p>
              </div>
            </div>
          </div>

          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Sign In
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange("username")}
                    placeholder="Enter your username"
                    required
                    disabled={isLoading}
                    autoComplete="username"
                    className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange("password")}
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-100 rounded-lg blur-sm" />
                    <div className="relative bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                        </div>
                        <span className="text-sm text-red-700 font-medium">{error}</span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:transform-none disabled:hover:scale-100"
                  disabled={isLoading || !formData.username || !formData.password}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <LogIn className="w-5 h-5" />
                      <span>Sign In</span>
                    </div>
                  )}
                </Button>
              </form>
              
              {/* Additional info */}
              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500">
                  Secure access to your device management platform
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
