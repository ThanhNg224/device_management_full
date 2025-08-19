"use client"
import { Plus, Eye, Circle, Settings, Download, Copy } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Device } from "../types"
import { DeviceDetailsModal } from "./DeviceDetailsModal"
import { DeviceEditModal } from "./DeviceEditModal"
import { uploadApk } from "../lib/api"
import { copyWithToast } from "../lib/clipboard"
import { useToast } from "./Toast"

interface DeviceTableProps {
  devices: Device[]
  onUpdateDevice: (device: Device) => void
}

export function DeviceTable({ devices, onUpdateDevice }: DeviceTableProps) {
  const [selectedDevice, setSelectedDevice] = React.useState<Device | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null) // Track which device is updating
  const { showToast } = useToast()

  const handleViewDetails = (device: Device) => {
    setSelectedDevice(device)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDevice(null)
  }

  const handleEditDevice = (device: Device) => {
    setSelectedDevice(device)
    setIsEditModalOpen(true)
    setIsModalOpen(false) // Close details modal if open
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedDevice(null)
  }

  const handleSaveDevice = (updatedDevice: Device) => {
    onUpdateDevice(updatedDevice)
    console.log("Device updated:", updatedDevice)
  }

  const handleCopyDeviceCode = async (deviceCode: string) => {
    await copyWithToast(
      deviceCode,
      () => showToast(`Device code "${deviceCode}" copied to clipboard!`, 'success'),
      (error) => showToast(error, 'error')
    )
  }

  const handleUpdateDevice = async (device: Device) => {
    // Check if device is online
    if (device.status !== "Online") {
      // Show toast notification - you can replace this with your preferred toast library
      alert("Device is offline. Cannot perform update.")
      return
    }

    // Create file input element
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.apk'
    fileInput.style.display = 'none'

    fileInput.onchange = async (event) => {
      const target = event.target as HTMLInputElement
      const file = target.files?.[0]
      
      if (!file) {
        return
      }

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.apk')) {
        alert("Please select a valid APK file.")
        return
      }

      setIsUpdating(device.deviceCode)

      try {
        // Upload APK file and send update to device (backend handles both)
        console.log("Uploading APK file and sending update to device:", file.name)
        const { downloadUrl } = await uploadApk(file, device.deviceCode)
        console.log("APK uploaded and update sent successfully, URL:", downloadUrl)
        
        // Show success message
        alert(`Update sent successfully to device ${device.deviceCode}`)
        
      } catch (error) {
        console.error("Update failed:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
        alert(`Update failed: ${errorMessage}`)
      } finally {
        setIsUpdating(null)
        // Clean up file input
        document.body.removeChild(fileInput)
      }
    }

    // Add to DOM and trigger click
    document.body.appendChild(fileInput)
    fileInput.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
          <p className="text-muted-foreground">Manage and monitor your device fleet</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Device
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Overview</CardTitle>
          <CardDescription>Current status and performance metrics for all registered devices</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30 hover:bg-muted/40">
                  <TableHead className="font-bold text-foreground py-4">Device Code</TableHead>
                  <TableHead className="font-bold text-foreground">Status</TableHead>
                  <TableHead className="font-bold text-foreground">Last Connected</TableHead>
                  <TableHead className="font-bold text-foreground">Location</TableHead>
                  <TableHead className="font-bold text-foreground">Version</TableHead>
                  <TableHead className="font-bold text-foreground">CPU</TableHead>
                  <TableHead className="font-bold text-foreground">RAM</TableHead>
                  <TableHead className="font-bold text-foreground">Temperature</TableHead>
                  <TableHead className="font-bold text-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device, index) => (
                  <TableRow
                    key={device.deviceCode}
                    className={`
                      transition-all duration-200 hover:bg-muted/50 hover:shadow-sm hover:scale-[1.01]
                      ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                    `}
                  >
                    <TableCell className="font-semibold py-3">
                      <div className="flex items-center gap-2">
                        <span>{device.deviceCode}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                          onClick={() => handleCopyDeviceCode(device.deviceCode)}
                          title="Copy device code"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={device.status === "Online" ? "default" : "destructive"}
                        className={`
                          flex items-center gap-1.5 w-fit font-medium
                          ${
                            device.status === "Online"
                              ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-300"
                              : "bg-red-100 text-red-800 hover:bg-red-200 border-red-300"
                          }
                        `}
                      >
                        <Circle
                          className={`h-2 w-2 fill-current ${device.status === "Online" ? "text-green-600" : "text-red-600"}`}
                        />
                        {device.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">{device.lastConnected}</TableCell>
                    <TableCell className="text-sm">{device.location}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {device.version}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`
                            text-xs font-semibold border-2
                            ${
                              (device.lastPerformance?.cpu ?? 0) > 80
                                ? "border-red-300 bg-red-50 text-red-700"
                                : (device.lastPerformance?.cpu ?? 0) > 60
                                  ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                                  : "border-green-300 bg-green-50 text-green-700"
                            }
                          `}
                        >
                          {(device.lastPerformance?.cpu ?? 0).toFixed(2)}%
                        </Badge>
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`
                              h-full transition-all duration-300 rounded-full
                              ${
                                (device.lastPerformance?.cpu ?? 0) > 80
                                  ? "bg-gradient-to-r from-red-400 to-red-600"
                                  : (device.lastPerformance?.cpu ?? 0) > 60
                                    ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                    : "bg-gradient-to-r from-green-400 to-green-600"
                              }
                            `}
                            style={{ width: `${device.lastPerformance?.cpu ?? 0}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`
                            text-xs font-semibold border-2
                            ${
                              (device.lastPerformance?.ram ?? 0) > 80
                                ? "border-red-300 bg-red-50 text-red-700"
                                : (device.lastPerformance?.ram ?? 0) > 60
                                  ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                                  : "border-green-300 bg-green-50 text-green-700"
                            }
                          `}
                        >
                          {(device.lastPerformance?.ram ?? 0).toFixed(2)}%
                        </Badge>
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`
                              h-full transition-all duration-300 rounded-full
                              ${
                                (device.lastPerformance?.ram ?? 0) > 80
                                  ? "bg-gradient-to-r from-red-400 to-red-600"
                                  : (device.lastPerformance?.ram ?? 0) > 60
                                    ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                    : "bg-gradient-to-r from-green-400 to-green-600"
                              }
                            `}
                            style={{ width: `${device.lastPerformance?.ram ?? 0}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`
                            text-xs font-semibold border-2
                            ${
                              (device.lastPerformance?.temperature ?? 0) > 80
                                ? "border-red-300 bg-red-50 text-red-700"
                                : (device.lastPerformance?.temperature ?? 0) > 60
                                  ? "border-orange-300 bg-orange-50 text-orange-700"
                                  : "border-blue-300 bg-blue-50 text-blue-700"
                            }
                          `}
                        >
                          {(device.lastPerformance?.temperature ?? 0).toFixed(2)}°C
                        </Badge>
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`
                              h-full transition-all duration-300 rounded-full
                              ${
                                (device.lastPerformance?.temperature ?? 0) > 80
                                  ? "bg-gradient-to-r from-red-400 to-red-600"
                                  : (device.lastPerformance?.temperature ?? 0) > 60
                                    ? "bg-gradient-to-r from-orange-400 to-orange-600"
                                    : "bg-gradient-to-r from-blue-400 to-blue-600"
                              }
                            `}
                            style={{ width: `${Math.min((device.lastPerformance?.temperature ?? 0), 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                          title="View Details"
                          onClick={() => handleViewDetails(device)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-700 transition-colors"
                          title="Edit Configuration"
                          onClick={() => handleEditDevice(device)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700 transition-colors"
                          title="Update Version"
                          onClick={() => handleUpdateDevice(device)}
                          disabled={isUpdating === device.deviceCode}
                        >
                          {isUpdating === device.deviceCode ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <DeviceDetailsModal
        device={selectedDevice}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onEdit={handleEditDevice}
      />
      <DeviceEditModal
        device={selectedDevice}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveDevice}
      />
    </div>
  )
}

