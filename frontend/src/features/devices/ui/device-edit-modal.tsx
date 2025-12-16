"use client"
import { Save, X, RotateCcw } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useToast } from "../../../core/ui/toast"
import type { Device } from "../domain/device"
import { makeDevicesController } from "../../../di/make-devices-controller"

interface DeviceEditModalProps {
  device: Device | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedDevice: Device) => void
}

export function DeviceEditModal({ device, isOpen, onClose, onSave }: DeviceEditModalProps) {
  const [editedDevice, setEditedDevice] = React.useState<Device | null>(null)
  const [isRebooting, setIsRebooting] = React.useState(false)
  const { showToast } = useToast()
  const devicesController = React.useMemo(() => makeDevicesController(), [])

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
      showToast("Device configuration saved successfully", "success")
    } catch (error) {
      console.error("Failed to save device configuration:", error)
      showToast("Failed to save device configuration", "error")
    }
  }

  const handleReboot = async () => {
    if (!device) return
    
    try {
      setIsRebooting(true)
      await devicesController.rebootDevice({ deviceCode: device.deviceCode })
      showToast(`Reboot command sent to device ${device.deviceCode}`, "success")
    } catch (error) {
      console.error("Failed to reboot device:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to send reboot command"
      showToast(errorMessage, "error")
    } finally {
      setIsRebooting(false)
    }
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
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Device Reboot</Label>
                  <p className="text-sm text-muted-foreground">Send reboot command to restart the device</p>
                </div>
                <Button
                  onClick={handleReboot}
                  disabled={isRebooting || device.status !== "Online"}
                  variant="outline"
                  className="bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100 hover:border-orange-400 disabled:opacity-50"
                >
                  {isRebooting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Rebooting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reboot Device
                    </>
                  )}
                </Button>
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
