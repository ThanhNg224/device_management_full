"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./src/components/AppSidebar"
import { DeviceTable } from "./src/components/DeviceTable"
import { DeviceLogsTable } from "./src/components/DeviceLogsTable"
import { fetchDevices } from "./src/lib/api"
import { mockLogs } from "./src/data/logsMock"
import { mockDevices } from "./src/data/devicesMock"
import type { Device } from "./src/types"

export default function Component() {
  const [activeTab, setActiveTab] = React.useState("devices")
  const [mounted, setMounted] = React.useState(false)
  const [devices, setDevices] = React.useState<Device[]>([]) // Initialize as empty array
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

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
    <SidebarProvider>
      <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
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
            </>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}