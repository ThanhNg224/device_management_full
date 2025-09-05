"use client"
import { Eye, Circle, Settings, Download, Copy, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
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
  const [currentPage, setCurrentPage] = React.useState(1)
  const [sortColumn, setSortColumn] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const { showToast } = useToast()

  // Pagination logic
  const itemsPerPage = 10
  
  // Sorting logic
  const sortedDevices = React.useMemo(() => {
    if (!sortColumn) return devices
    
    return [...devices].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number
      
      switch (sortColumn) {
        case 'deviceCode':
          aValue = a.deviceCode
          bValue = b.deviceCode
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'location':
          aValue = a.location
          bValue = b.location
          break
        case 'version':
          aValue = a.version
          bValue = b.version
          break
        default:
          return 0
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }, [devices, sortColumn, sortDirection])
  
  const totalPages = Math.ceil(sortedDevices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDevices = sortedDevices.slice(startIndex, endIndex)

  const handleViewDetails = (device: Device) => {
    setSelectedDevice(device)
    setIsModalOpen(true)
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  const getSortIcon = (column: string) => {
    // Always show a sort icon: ChevronsUpDown when unsorted, arrow when sorted
    if (sortColumn !== column) {
      return <ChevronsUpDown size={12} className="opacity-40" />
    }
    return sortDirection === 'asc'
      ? <ChevronUp size={12} className="text-foreground" />
      : <ChevronDown size={12} className="text-foreground" />
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDevice(null)
  }

  const handleEditDevice = (device: Device) => {
    // Prevent editing when device is offline
    if (device.status !== "Online") {
      showToast("Device is offline. Cannot edit configuration.", "error")
      return
    }

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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Overview</CardTitle>
          <CardDescription>Current status and performance metrics for all registered devices</CardDescription>
        </CardHeader>
  <CardContent className="p-0 overflow-x-hidden">
          <div>
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30 hover:bg-muted/40">
                  <TableHead
                    className="font-bold text-foreground py-4 cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => handleSort('deviceCode')}
                  >
                    <div className="flex items-center gap-1">
                      Device Code{getSortIcon('deviceCode')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="font-bold text-foreground cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status{getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead className="font-bold text-foreground hidden md:table-cell">Last Connected</TableHead>
                  <TableHead
                    className="font-bold text-foreground hidden lg:table-cell cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => handleSort('location')}
                  >
                    <div className="flex items-center gap-1">
                      Location{getSortIcon('location')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="font-bold text-foreground hidden sm:table-cell cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => handleSort('version')}
                  >
                    <div className="flex items-center gap-1">
                      Version{getSortIcon('version')}
                    </div>
                  </TableHead>
                  <TableHead className="font-bold text-foreground hidden xl:table-cell">CPU</TableHead>
                  <TableHead className="font-bold text-foreground hidden xl:table-cell">RAM</TableHead>
                  <TableHead className="font-bold text-foreground hidden xl:table-cell">Temperature</TableHead>
                  <TableHead className="font-bold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentDevices.map((device, index) => {
                  const isOnline = device.status === "Online"
                  return (
                    <TableRow
                      key={device.deviceCode}
                      className={
                        `transition-all duration-200 ` +
                        (index % 2 === 0 ? "bg-background" : "bg-muted/20") +
                        (isOnline ? " hover:bg-muted/50 hover:shadow-sm" : "")
                      }
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
                      <TableCell className="text-sm text-muted-foreground font-mono hidden md:table-cell">{device.lastConnected}</TableCell>
                      <TableCell className="text-sm hidden lg:table-cell">{device.location}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="font-mono text-xs">
                          {device.version}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
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
                      <TableCell className="hidden xl:table-cell">
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
                      <TableCell className="hidden xl:table-cell">
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
                      <TableCell>
                        <div className="flex items-center justify-start gap-1">
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
                            className={`h-8 w-8 p-0 ${isOnline ? 'hover:bg-orange-100 hover:text-orange-700 transition-colors' : 'opacity-50 cursor-not-allowed'}`}
                            title={isOnline ? "Edit Configuration" : "Device offline - cannot edit"}
                            onClick={() => isOnline ? handleEditDevice(device) : showToast("Device is offline. Cannot edit configuration.", "error")}
                            disabled={!isOnline}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700 transition-colors"
                            title="Install apk"
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
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {sortedDevices.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, sortedDevices.length)} of {sortedDevices.length} devices
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2 text-muted-foreground">...</span>
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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

