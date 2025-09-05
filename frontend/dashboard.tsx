"use client"

import * as React from "react"
import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./src/components/AppSidebar"
import { DeviceTable } from "./src/components/DeviceTable"
import { DeviceLogsTable } from "./src/components/DeviceLogsTable"
import { VersionsTable } from "./src/components/VersionsTable"
import { ToastProvider } from "./src/components/Toast"
import { fetchDevices } from "./src/lib/api"
import { mockLogs } from "./src/data/logsMock"
import { mockDevices } from "./src/data/devicesMock"
import type { Device } from "./src/types"

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get tab from URL, default to "devices" if not present
  const [activeTab, setActiveTab] = React.useState(() => {
    return searchParams.get('tab') || "devices"
  })
  
  const [mounted, setMounted] = React.useState(false)
  const [devices, setDevices] = React.useState<Device[]>([]) // Initialize as empty array
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Function to change tab and update URL
  const handleTabChange = React.useCallback((newTab: string) => {
    setActiveTab(newTab)
    // Update URL without causing a page reload
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('tab', newTab)
    router.replace(newUrl.pathname + newUrl.search, { scroll: false })
  }, [router])

  // Listen for URL changes (browser back/forward)
  React.useEffect(() => {
    const currentTab = searchParams.get('tab') || "devices"
    if (currentTab !== activeTab) {
      setActiveTab(currentTab)
    }
  }, [searchParams, activeTab])

  // Add function to update a device
  const updateDevice = React.useCallback((updatedDevice: Device) => {
    setDevices(prevDevices => 
      prevDevices.map(device => 
        device.deviceCode === updatedDevice.deviceCode ? updatedDevice : device
      )
    )
  }, [])

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setError(null)
        const res = await fetchDevices()
        console.log("Fetched Devices:", res)
        
        if (Array.isArray(res)) {
          setDevices(res)
        } else {
          console.error("fetchDevices did not return an array:", res)
          setError("Invalid data format received")
          setDevices(mockDevices)
        }
      } catch (err) {
        console.error("Error loading devices:", err)
        setError("Failed to load devices from server. Using local data.")
        setDevices(mockDevices)
      } finally {
        setLoading(false)
      }
    }
  
    // Load data immediately
    loadData()

    // Set up polling - fetch data every 10 seconds
    const interval = setInterval(loadData, 10000) // 10 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval)
  }, [])

  // Avoid hydration issues
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <ToastProvider>
      <SidebarProvider>
        <AppSidebar activeTab={activeTab} setActiveTab={handleTabChange} />
        <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">SunWorld Device Manager</h2>
            {error && (
              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                Offline Mode
              </span>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading devices...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "devices" && <DeviceTable devices={devices} onUpdateDevice={updateDevice} />}
              {activeTab === "logs" && <DeviceLogsTable />}
              {activeTab === "versions" && <VersionsTable onlineDevices={devices.filter(d => d.status === "Online" || d.status === 1)} />}
            </>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
    </ToastProvider>
  )
}

// Loading component for Suspense fallback
function DashboardLoading() {
  return (
    <div className="flex h-screen w-full animate-pulse">
      <div className="w-64 bg-muted border-r"></div>
      <div className="flex-1">
        <div className="h-16 border-b bg-background"></div>
        <div className="p-6 space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    </div>
  )
}

// Main component wrapped with Suspense
export default function Component() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  )
}