"use client"
import { Eye, Circle, Settings, Download, Copy, ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [filteredDevices, setFilteredDevices] = React.useState<Device[]>([])
  const [filters, setFilters] = React.useState({
    deviceCode: "all",
    status: "all",
    location: "all",
    version: "all",
    searchTerm: ""
  })
  const { showToast } = useToast()

  // Get unique values for filter dropdowns
  const uniqueDeviceCodes = [...new Set(devices.map((device) => device.deviceCode))]
  const uniqueStatuses = [...new Set(devices.map((device) => device.status))]
  const uniqueLocations = [...new Set(devices.map((device) => device.location))]
  const uniqueVersions = [...new Set(devices.map((device) => device.version))]

  // Pagination logic
  const itemsPerPage = 10
  
  // Apply filters whenever filters or devices change
  React.useEffect(() => {
    let filtered = devices

    // Filter by device code
    if (filters.deviceCode !== "all") {
      filtered = filtered.filter(device => device.deviceCode === filters.deviceCode)
    }

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter(device => device.status === filters.status)
    }

    // Filter by location
    if (filters.location !== "all") {
      filtered = filtered.filter(device => device.location === filters.location)
    }

    // Filter by version
    if (filters.version !== "all") {
      filtered = filtered.filter(device => device.version === filters.version)
    }

    // Filter by search term (searches in device code, device name, and location)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(device => 
        device.deviceCode.toLowerCase().includes(searchLower) ||
        device.deviceName.toLowerCase().includes(searchLower) ||
        device.location.toLowerCase().includes(searchLower) ||
        device.version.toLowerCase().includes(searchLower)
      )
    }

    setFilteredDevices(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [filters, devices])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      deviceCode: "all",
      status: "all",
      location: "all",
      version: "all",
      searchTerm: ""
    })
  }

  const hasActiveFilters = filters.deviceCode !== "all" || 
                          filters.status !== "all" || 
                          filters.location !== "all" || 
                          filters.version !== "all" || 
                          filters.searchTerm

  // Sorting logic
  const sortedDevices = React.useMemo(() => {
    const devicesToSort = filteredDevices.length > 0 || hasActiveFilters ? filteredDevices : devices
    if (!sortColumn) return devicesToSort
    
    return [...devicesToSort].sort((a, b) => {
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
  }, [filteredDevices, devices, hasActiveFilters, sortColumn, sortDirection])
  
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

      {/* Filter Bar */}
      <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">Filter Devices</CardTitle>
            </div>
            {hasActiveFilters && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                {sortedDevices.length} of {devices.length} devices
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search devices by code, name, location, or version..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              className="pl-10 pr-4 border-2 border-blue-200 focus:border-blue-400 focus:ring-blue-200 bg-white/80"
            />
            {filters.searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-blue-100"
                onClick={() => handleFilterChange("searchTerm", "")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-blue-900 flex items-center gap-1">
                <Circle className="h-3 w-3" />
                Device Code
              </label>
              <Select value={filters.deviceCode} onValueChange={(value) => handleFilterChange("deviceCode", value)}>
                <SelectTrigger className="border-2 border-gray-200 hover:border-blue-300 focus:border-blue-400 bg-white/80">
                  <SelectValue placeholder="All Devices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-medium">All Devices ({devices.length})</SelectItem>
                  {uniqueDeviceCodes.map((code) => (
                    <SelectItem key={code} value={code} className="font-mono text-sm">
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-blue-900 flex items-center gap-1">
                <Circle className="h-3 w-3" />
                Status
              </label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger className="border-2 border-gray-200 hover:border-blue-300 focus:border-blue-400 bg-white/80">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-medium">All Status</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={String(status)} value={String(status)} className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Circle 
                          className={`h-2 w-2 fill-current ${
                            status === "Online" ? "text-green-600" : "text-red-600"
                          }`} 
                        />
                        {status}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-blue-900 flex items-center gap-1">
                <Circle className="h-3 w-3" />
                Location
              </label>
              <Select value={filters.location} onValueChange={(value) => handleFilterChange("location", value)}>
                <SelectTrigger className="border-2 border-gray-200 hover:border-blue-300 focus:border-blue-400 bg-white/80">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-medium">All Locations</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      📍 {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-blue-900 flex items-center gap-1">
                <Circle className="h-3 w-3" />
                Version
              </label>
              <Select value={filters.version} onValueChange={(value) => handleFilterChange("version", value)}>
                <SelectTrigger className="border-2 border-gray-200 hover:border-blue-300 focus:border-blue-400 bg-white/80">
                  <SelectValue placeholder="All Versions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-medium">All Versions</SelectItem>
                  {uniqueVersions.map((version) => (
                    <SelectItem key={version} value={version} className="font-mono text-sm">
                      🔖 {version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 flex flex-col justify-end">
              <div className="space-y-2">
                {hasActiveFilters && (
                  <Button 
                    onClick={clearFilters} 
                    variant="outline" 
                    className="w-full border-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                )}
                <div className="text-xs text-center text-muted-foreground">
                  {hasActiveFilters ? (
                    <span className="text-blue-600 font-medium">
                      Filters Active
                    </span>
                  ) : (
                    <span>
                      {devices.length} total devices
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-blue-200">
              <span className="text-sm font-medium text-blue-900">Active filters:</span>
              {filters.searchTerm && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  Search: &quot;{filters.searchTerm}&quot;
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-blue-200"
                    onClick={() => handleFilterChange("searchTerm", "")}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              {filters.deviceCode !== "all" && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  Device: {filters.deviceCode}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-green-200"
                    onClick={() => handleFilterChange("deviceCode", "all")}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              {filters.status !== "all" && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                  Status: {filters.status}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-purple-200"
                    onClick={() => handleFilterChange("status", "all")}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              {filters.location !== "all" && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                  Location: {filters.location}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-orange-200"
                    onClick={() => handleFilterChange("location", "all")}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              {filters.version !== "all" && (
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                  Version: {filters.version}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-indigo-200"
                    onClick={() => handleFilterChange("version", "all")}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Found {sortedDevices.length} of {devices.length} devices
              {filters.searchTerm && (
                <span className="text-blue-700"> matching &quot;{filters.searchTerm}&quot;</span>
              )}
            </span>
          </div>
          <Badge variant="outline" className="border-blue-300 text-blue-700 bg-white/80">
            {Math.round((sortedDevices.length / devices.length) * 100)}% match
          </Badge>
        </div>
      )}

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

