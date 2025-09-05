"use client"
import { Save, X } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import type { Device } from "../types"

interface DeviceEditModalProps {
  device: Device | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedDevice: Device) => void
}

export function DeviceEditModal({ device, isOpen, onClose, onSave }: DeviceEditModalProps) {
  const [editedDevice, setEditedDevice] = React.useState<Device | null>(null)

  React.useEffect(() => {
    if (device) {
      setEditedDevice({ ...device })
    }
  }, [device])

  if (!device || !editedDevice) return null

  const handleSave = () => {
    try {
      onSave(editedDevice)
      onClose()
      // You can add a success toast here if you have a toast library
      console.log("Device configuration saved successfully")
    } catch (error) {
      console.error("Failed to save device configuration:", error)
      // You can add an error toast here if you have a toast library
      alert("Failed to save device configuration")
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setEditedDevice(prev => {
      if (!prev) return null
      return { ...prev, [field]: value }
    })
  }

  const handleConfigChange = (field: string, value: number) => {
    setEditedDevice(prev => {
      if (!prev) return null
      return {
        ...prev,
        config: {
          ...prev.config,
          [field]: value
        }
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full md:max-w-[800px] lg:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b">
          <DialogTitle className="text-2xl font-bold">Edit Device Configuration</DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {/* Basic Information (Read-only display) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Device Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Device Code</Label>
                <p className="text-sm font-semibold bg-muted p-2 rounded">{device.deviceCode}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <Badge
                  variant={device.status === "Online" ? "default" : "destructive"}
                  className={`
                    ${device.status === "Online"
                      ? "bg-green-100 text-green-800 border-green-300"
                      : "bg-red-100 text-red-800 border-red-300"
                    }
                  `}
                >
                  {device.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Version</Label>
                <Badge variant="outline" className="font-mono text-xs">
                  {device.version}
                </Badge>
              </div>
            </div>
          </div>

          {/* Network Information - Editable */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Network Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="ipAddress">IP Address</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded">{device.ipAddress}</p>
              </div>
            </div>
          </div>

          {/* Configuration - Editable */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Configuration</h3>
            <div className="text-sm text-muted-foreground">
              Device configuration settings are managed through the Device Settings section below.
            </div>
          </div>

          {/* Device Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Device Settings</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoReboot">Auto Reboot</Label>
                  <p className="text-sm text-muted-foreground">Enable automatic device restart</p>
                </div>
                <Switch
                  id="autoReboot"
                  checked={editedDevice.autoReboot}
                  onCheckedChange={(checked) => handleInputChange("autoReboot", checked)}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Volume: {editedDevice.config?.volume || 0}%</Label>
                  <Slider
                    value={[editedDevice.config?.volume || 0]}
                    onValueChange={(value) => handleConfigChange("volume", value[0])}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Brightness: {editedDevice.config?.brightness || 0}%</Label>
                  <Slider
                    value={[editedDevice.config?.brightness || 0]}
                    onValueChange={(value) => handleConfigChange("brightness", value[0])}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          <Button onClick={onClose} variant="outline" className="px-6 py-2">
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 px-6 py-2">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
