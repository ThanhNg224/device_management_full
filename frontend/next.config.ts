import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async rewrites() {
    // Use environment variable for API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    
    // In production, we may not need rewrites if using direct API calls
    // In development, rewrites help with CORS and proxy functionality
    if (!apiUrl) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('NEXT_PUBLIC_API_URL not set in production - API calls may fail')
        return []
      }
      // Development fallback
      console.log('Using localhost fallback for API rewrites')
      return [
        {
          source: "/api/device/listDevice",
          destination: "http://localhost:3000/api/device/listDevice",
        },
      ]
    }
    
    return [
      {
        source: "/api/device/listDevice",
        destination: `${apiUrl}/api/device/listDevice`,
      },
      // Add more API routes here if needed for proxying
    ]
  },
}

export default nextConfig
