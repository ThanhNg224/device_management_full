"use client"

import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, Search } from "lucide-react"
import { makeVersionsController } from "../../../di/make-versions-controller"
import { useToast } from "../../../core/ui/toast"
import type { Version } from "../domain/version"
import type { Device } from "../../devices/domain/device"

interface InstallVersionModalProps {
  version: Version
  onlineDevices: Device[]
  onClose: () => void
  onSuccess: () => void
}

export function InstallVersionModal({ version, onlineDevices, onClose, onSuccess }: InstallVersionModalProps) {
  const versionsController = React.useMemo(() => makeVersionsController(), [])
  const [loading, setLoading] = React.useState(false)
  const [selectedDevices, setSelectedDevices] = React.useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = React.useState("")

  const { showToast } = useToast()

  // Filter devices based on search query
  const filteredDevices = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return onlineDevices
    }
    
    const query = searchQuery.toLowerCase()
    return onlineDevices.filter(device => 
      device.deviceCode.toLowerCase().includes(query) ||
      device.deviceName?.toLowerCase().includes(query) ||
      device.location?.toLowerCase().includes(query)
    )
  }, [onlineDevices, searchQuery])

  const handleDeviceToggle = (deviceCode: string) => {
    const newSelected = new Set(selectedDevices)
    if (newSelected.has(deviceCode)) {
      newSelected.delete(deviceCode)
    } else {
      newSelected.add(deviceCode)
    }
    setSelectedDevices(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedDevices.size === filteredDevices.length) {
      setSelectedDevices(new Set())
    } else {
      setSelectedDevices(new Set(filteredDevices.map(d => d.deviceCode)))
    }
  }

  const handleInstall = async () => {
    if (selectedDevices.size === 0) {
      showToast("Please select at least one device", "error")
      return
    }

    try {
      setLoading(true)
      
      const result = await versionsController.installVersionOnDevices({
        versionId: version.id,
        deviceCodes: Array.from(selectedDevices),
      })
      
      // Show summary toast
      const totalSelected = selectedDevices.size
      const successCount = result.ok.length
      const failedCount = result.failed.length
      
      let message = `Installation completed: ${successCount}/${totalSelected} devices`
      if (failedCount > 0) {
        message += `. Failed: ${result.failed.join(", ")}`
      }
      
      showToast(message, failedCount > 0 ? "error" : "success")
      onSuccess()
    } catch (err) {
      console.error("Failed to install version:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to install version"
      showToast(errorMessage, "error")
    } finally {
      setLoading(false)
    }
  }

  if (onlineDevices.length === 0) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install Version</DialogTitle>
            <DialogDescription>
              No online devices available for installation
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              All devices are currently offline. Versions can only be installed on online devices.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Install Version {version.versionCode}</DialogTitle>
          <DialogDescription>
            Select devices to install {version.versionName || `version ${version.versionCode}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Version info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">{version.versionCode}</Badge>
              {version.versionName && (
                <span className="font-medium">{version.versionName}</span>
              )}
            </div>
            {version.note && (
              <p className="text-xs text-muted-foreground mt-1">{version.note}</p>
            )}
          </div>

          <Separator />

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Devices</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by device code, name, or location..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Device selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Select Devices ({selectedDevices.size}/{filteredDevices.length} selected)
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredDevices.length === 0}
              >
                {selectedDevices.size === filteredDevices.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {filteredDevices.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {searchQuery ? "No devices match your search" : "No online devices available"}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredDevices.map((device) => (
                    <label
                      key={device.deviceCode}
                      className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDevices.has(device.deviceCode)}
                        onChange={() => handleDeviceToggle(device.deviceCode)}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono">{device.deviceCode}</code>
                          <Badge variant="outline" className="text-xs">
                            {device.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {device.deviceName && <span>{device.deviceName} • </span>}
                          {device.location}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleInstall} 
            disabled={loading || selectedDevices.size === 0}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Installing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Install on {selectedDevices.size} device{selectedDevices.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
