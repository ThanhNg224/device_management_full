"use client"

import * as React from "react"
import { Search, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DeviceLog } from "../domain/device-log"
import { makeDeviceLogsController } from "../../../di/make-device-logs-controller"

export function DeviceLogsTable() {
  const deviceLogsController = React.useMemo(() => makeDeviceLogsController(), [])
  const [logs, setLogs] = React.useState<DeviceLog[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [filteredLogs, setFilteredLogs] = React.useState<DeviceLog[]>([])
  const [filters, setFilters] = React.useState({
    deviceCode: "all",
    accessType: "all",
    fromDate: "",
    toDate: "",
    searchTerm: ""
  })
  
  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentLogs = filteredLogs.slice(startIndex, endIndex)

  const uniqueDeviceCodes = [...new Set(logs.map((log) => log.deviceCode))]

  // Fetch logs on component mount
  React.useEffect(() => {
    const loadLogs = async () => {
      try {
        setError(null)
        const fetchedLogs = await deviceLogsController.listDeviceLogs()
        setLogs(fetchedLogs)
      } catch (err) {
        console.error("Error loading logs:", err)
        setError("Failed to load logs from server. Using local data.")
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [deviceLogsController])

  // Apply filters whenever filters or logs change
  React.useEffect(() => {
    let filtered = logs

    // Filter by device code
    if (filters.deviceCode !== "all") {
      filtered = filtered.filter(log => log.deviceCode === filters.deviceCode)
    }

    // Filter by access type
    if (filters.accessType !== "all") {
      filtered = filtered.filter(log => log.accessType === filters.accessType)
    }

    // Filter by date range
    if (filters.fromDate) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.time).toISOString().split('T')[0]
        return logDate >= filters.fromDate
      })
    }

    if (filters.toDate) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.time).toISOString().split('T')[0]
        return logDate <= filters.toDate
      })
    }

    // Filter by search term (searches in device code, full name, and note)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(log => 
        log.deviceCode.toLowerCase().includes(searchLower) ||
        log.fullName.toLowerCase().includes(searchLower) ||
        log.note.toLowerCase().includes(searchLower) ||
        log.result.toLowerCase().includes(searchLower)
      )
    }

    setFilteredLogs(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [filters, logs])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    // Search is automatically triggered by useEffect, but we can add any additional logic here
    console.log("Search triggered with filters:", filters)
  }

  const clearFilters = () => {
    setFilters({
      deviceCode: "all",
      accessType: "all",
      fromDate: "",
      toDate: "",
      searchTerm: ""
    })
  }

  const hasActiveFilters = filters.deviceCode !== "all" || 
                          filters.accessType !== "all" || 
                          filters.fromDate || 
                          filters.toDate || 
                          filters.searchTerm

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Device Logs</h1>
          <p className="text-muted-foreground">View and analyze device activity logs</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading logs...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Device Logs</h1>
          <p className="text-muted-foreground">View and analyze device activity logs</p>
          {error && (
            <p className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded mt-2 inline-block">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by device code, full name, result, or note..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Device Code</label>
                <Select value={filters.deviceCode} onValueChange={(value) => handleFilterChange("deviceCode", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Devices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    {uniqueDeviceCodes.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filters.accessType} onValueChange={(value) => handleFilterChange("accessType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="0">Valid</SelectItem>
                    <SelectItem value="1">Invalid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Input 
                  type="date" 
                  className="w-full" 
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Input 
                  type="date" 
                  className="w-full" 
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange("toDate", e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="outline" className="px-4">
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {logs.length} entries
          {filters.searchTerm && ` matching "${filters.searchTerm}"`}
        </div>
      )}

      <Card>
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="font-bold">Activity Logs</CardTitle>
          <CardDescription>Recent events and activities from all connected devices</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 hover:bg-gray-100">
                  <TableHead className="font-bold text-foreground py-3">Device Code</TableHead>
                  <TableHead className="font-bold text-foreground">Status</TableHead>
                  <TableHead className="font-bold text-foreground">Full Name</TableHead>
                  <TableHead className="font-bold text-foreground">Time</TableHead>
                  <TableHead className="font-bold text-foreground">Result</TableHead>
                  <TableHead className="font-bold text-foreground">Similarity</TableHead>
                  <TableHead className="font-bold text-foreground">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {logs.length === 0 ? "No logs available" : "No logs found matching your search criteria"}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentLogs.map((log, index) => (
                    <TableRow
                      key={index}
                      className={`
                        transition-colors duration-150 hover:bg-muted/30
                        ${index % 2 === 0 ? "bg-background" : "bg-muted/10"}
                      `}
                    >
                      <TableCell className="font-semibold py-2">{log.deviceCode}</TableCell>
                      <TableCell className="py-2">
                        <Badge
                          className={`
                            text-xs font-semibold
                            ${
                              log.accessType === "0"
                                ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                                : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
                            }
                          `}
                          variant="outline"
                        >
                          {log.accessType === "0" ? "Valid" : "Invalid"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium py-2">{log.fullName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono py-2">{log.time}</TableCell>
                      <TableCell className="py-2">
                        <Badge
                          className={`
                            text-xs font-semibold
                            ${
                              log.result === "Success"
                                ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                                : log.result === "Failed"
                                  ? "bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
                                  : log.result === "Warning"
                                    ? "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200"
                                    : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
                            }
                          `}
                          variant="outline"
                        >
                          {log.result}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm py-2">{log.similarity}</TableCell>
                      <TableCell className="py-2">
                        <div className="text-sm text-muted-foreground max-w-xs truncate cursor-help" title={log.note}>
                          {log.note}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredLogs.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} entries
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
    </div>
  )
}
