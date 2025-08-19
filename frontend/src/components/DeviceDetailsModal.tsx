"use client"
import { Edit, Circle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Device } from "../types"

interface DeviceDetailsModalProps {
  device: Device | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (device: Device) => void
}

export function DeviceDetailsModal({ device, isOpen, onClose, onEdit }: DeviceDetailsModalProps) {
  if (!device) return null

  const handleEdit = () => {
    if (onEdit) {
      onEdit(device)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full md:max-w-[1100px] lg:max-w-[1400px] max-h-[90vh] overflow-y-auto">
      <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b">
        <DialogTitle className="text-2xl font-bold">Device Details</DialogTitle>
      </DialogHeader>

        <div className="space-y-8 py-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Device Code</label>
                <p className="text-sm font-semibold">{device.deviceCode}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Device Name</label>
                <p className="text-sm">{device.deviceName}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Unit/Company</label>
                <p className="text-sm">{device.unitCompany}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Status</label>
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
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Version</label>
                <Badge variant="outline" className="font-mono text-xs">
                  {device.version}
                </Badge>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p className="text-sm">{device.location}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Area</label>
                <p className="text-sm">{device.area}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Language</label>
                <p className="text-sm">{device.language}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Description</h3>
            <div className="space-y-1">
              <p className="text-base text-muted-foreground leading-relaxed">{device.description}</p>
            </div>
          </div>

          {/* Network Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Network Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">IMEI</label>
                <p className="text-sm font-mono">{device.imei}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Server Address</label>
                <p className="text-sm font-mono">{device.serverAddress}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Mac Address</label>
                <p className="text-sm font-mono">{device.macAddress}</p>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Temperature Threshold</label>
                <p className="text-sm">{device.temperatureThreshold}°C</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Face Threshold</label>
                <p className="text-sm">{device.faceThreshold}%</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Distance</label>
                <p className="text-sm">{device.distance}m</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Last Connected</label>
                <p className="text-sm font-mono">{device.lastConnected}</p>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Settings</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Auto Reboot</label>
                <Badge
                  variant={device.autoReboot ? "default" : "secondary"}
                  className={
                    device.autoReboot
                      ? "bg-green-100 text-green-800 border-green-300"
                      : "bg-gray-100 text-gray-800 border-gray-300"
                  }
                >
                  {device.autoReboot ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">Volume</label>
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className="text-sm font-semibold border-2 border-blue-300 bg-blue-50 text-blue-700 min-w-[60px] justify-center"
                  >
                    {device.config?.volume || 0}%
                  </Badge>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                      style={{ width: `${device.config?.volume || 0}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">Brightness</label>
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className="text-sm font-semibold border-2 border-yellow-300 bg-yellow-50 text-yellow-700 min-w-[60px] justify-center"
                  >
                    {device.config?.brightness || 0}%
                  </Badge>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600"
                      style={{ width: `${device.config?.brightness || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">CPU Usage</label>
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className={`
                      text-sm font-semibold border-2 min-w-[60px] justify-center
                      ${
                        device.lastPerformance.cpu > 80
                          ? "border-red-300 bg-red-50 text-red-700"
                          : device.lastPerformance.cpu > 60
                            ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                            : "border-green-300 bg-green-50 text-green-700"
                      }
                    `}
                  >
                    {(device.lastPerformance?.cpu ?? 0).toFixed(2)}%
                  </Badge>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`
                        h-full transition-all duration-300 rounded-full
                        ${
                          device.lastPerformance.cpu > 80
                            ? "bg-gradient-to-r from-red-400 to-red-600"
                            : device.lastPerformance.cpu > 60
                              ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                              : "bg-gradient-to-r from-green-400 to-green-600"
                        }
                      `}
                      style={{ width: `${device.lastPerformance.cpu}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">RAM Usage</label>
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className={`
                      text-sm font-semibold border-2 min-w-[60px] justify-center
                      ${
                        device.lastPerformance.ram > 80
                          ? "border-red-300 bg-red-50 text-red-700"
                          : device.lastPerformance.ram > 60
                            ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                            : "border-green-300 bg-green-50 text-green-700"
                      }
                    `}
                  >
                    {(device.lastPerformance?.ram ?? 0).toFixed(2)}%
                  </Badge>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`
                        h-full transition-all duration-300 rounded-full
                        ${
                          device.lastPerformance.ram > 80
                            ? "bg-gradient-to-r from-red-400 to-red-600"
                            : device.lastPerformance.ram > 60
                              ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                              : "bg-gradient-to-r from-green-400 to-green-600"
                        }
                      `}
                      style={{ width: `${device.lastPerformance.ram}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">Temperature</label>
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className="text-sm font-semibold border-2 border-blue-300 bg-blue-50 text-blue-700 min-w-[60px] justify-center"
                  >
                    {(device.lastPerformance?.temperature ?? 0).toFixed(2)}°C
                  </Badge>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                      style={{ width: `${Math.min(device.lastPerformance.temperature, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700 px-6 py-2">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

