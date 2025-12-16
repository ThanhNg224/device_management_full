"use client"

import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Upload } from "lucide-react"
import { makeVersionsController } from "../../../di/make-versions-controller"
import { useToast } from "../../../core/ui/toast"
import type { Version } from "../domain/version"

interface VersionFormModalProps {
  mode: "add" | "edit"
  version?: Version
  existingVersions?: Version[] // Add this to check for duplicates client-side
  onClose: () => void
  onSuccess: () => void
}

export function VersionFormModal({ mode, version, existingVersions = [], onClose, onSuccess }: VersionFormModalProps) {
  const versionsController = React.useMemo(() => makeVersionsController(), [])
  const [loading, setLoading] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [versionCode, setVersionCode] = React.useState(
    mode === "edit" ? version?.versionCode || "" : ""
  )
  const [versionName, setVersionName] = React.useState(
    mode === "edit" ? version?.versionName || "" : ""
  )
  const [note, setNote] = React.useState(
    mode === "edit" ? version?.note || "" : ""
  )
  const [versionCodeError, setVersionCodeError] = React.useState<string | null>(null)
  const [versionCodeFormatError, setVersionCodeFormatError] = React.useState<string | null>(null)

  const { showToast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) {
      setFile(null)
      return
    }

    // Validate APK extension
    if (!selectedFile.name.toLowerCase().endsWith('.apk')) {
      showToast("Please select an APK file", "error")
      return
    }

    setFile(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous version code errors
    setVersionCodeError(null)
    setVersionCodeFormatError(null)
    
    if (mode === "add") {
      // Validation for add mode
      if (!file) {
        showToast("Please select an APK file", "error")
        return
      }
      
      if (!versionCode.trim()) {
        setVersionCodeFormatError("Please enter a version code")
        return
      }

      // Validate semantic version format (x.y.z)
      const versionRegex = /^\d+\.\d+\.\d+$/
      if (!versionRegex.test(versionCode.trim())) {
        setVersionCodeFormatError("Version code must be in format x.y.z (e.g., 1.3.6)")
        return
      }

      // Client-side duplicate version check (faster feedback, reduces API calls)
      const duplicateVersion = existingVersions.find(
        v => v.versionCode === versionCode.trim()
      )
      if (duplicateVersion) {
        setVersionCodeError("Version code đã tồn tại. Vui lòng sử dụng version code khác.")
        return
      }
    }

    try {
      setLoading(true)

      if (mode === "add") {
        // Create version and wait for completion
        const result = await versionsController.createVersion({
          file: file!,
          versionCode: versionCode.trim(),
          versionName: versionName.trim() || undefined,
          note: note.trim() || undefined,
        })
        
        // Only show success message if creation was successful
        console.log("Version creation successful:", result)
        showToast("Tạo phiên bản thành công", "success")
        onSuccess()
        onClose()
      } else {
        if (!version?.id) {
          throw new Error("Version ID is required for editing")
        }
        
        const result = await versionsController.updateVersion({
          id: version.id,
          versionName: versionName.trim() || undefined,
          note: note.trim() || undefined,
        })
        
        console.log("Version update successful:", result)
        showToast("Version updated successfully", "success")
        onSuccess()
        onClose()
      }
    } catch (err) {
      console.error(`Failed to ${mode} version:`, err)
      
      // Ensure loading is stopped immediately on error
      setLoading(false)
      
      const errorMessage = err instanceof Error ? err.message : "Tạo phiên bản thất bại"
      
      // Check for duplicate version error (backup server-side validation)
      if (errorMessage.includes("versionCode") && errorMessage.includes("tồn tại")) {
        setVersionCodeError("Version code đã tồn tại. Vui lòng sử dụng version code khác.")
      } else {
        showToast(errorMessage, "error")
      }
      
      // Do not call onSuccess() or onClose() on error - keep modal open
      return // Explicitly return to avoid any further execution
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Version" : "Edit Version"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" 
              ? "Upload an APK file and provide version information"
              : "Update version name and note (file and version code cannot be changed)"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "add" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="file">APK File *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".apk"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                    required
                  />
                </div>
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="versionCode">Version Code *</Label>
                <Input
                  id="versionCode"
                  type="text"
                  value={versionCode}
                  onChange={(e) => {
                    const newValue = e.target.value
                    setVersionCode(newValue)
                    
                    // Clear previous errors when user starts typing
                    if (versionCodeError) {
                      setVersionCodeError(null)
                    }
                    if (versionCodeFormatError) {
                      setVersionCodeFormatError(null)
                    }
                    
                    // Real-time validation and duplicate check
                    if (mode === "add" && newValue.trim()) {
                      // Check format first
                      const versionRegex = /^\d+\.\d+\.\d+$/
                      if (!versionRegex.test(newValue.trim())) {
                        setVersionCodeFormatError("Version code must be in format x.y.z (e.g., 1.3.6)")
                      } else {
                        // Check for duplicates only if format is valid
                        const duplicateVersion = existingVersions.find(
                          v => v.versionCode === newValue.trim()
                        )
                        if (duplicateVersion) {
                          setVersionCodeError("Version code đã tồn tại")
                        }
                      }
                    }
                  }}
                  placeholder="e.g., 1.3.6"
                  required
                  className={versionCodeError || versionCodeFormatError ? "border-red-500" : ""}
                />
                {versionCodeFormatError && (
                  <p className="text-xs text-red-600">{versionCodeFormatError}</p>
                )}
                {versionCodeError && (
                  <p className="text-xs text-red-600">{versionCodeError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Semantic version format (x.y.z) - e.g., 1.3.6, 2.1.0
                </p>
              </div>
            </>
          )}

          {mode === "edit" && (
            <div className="space-y-2">
              <Label>Version Code</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground">
                {version?.versionCode} (cannot be changed)
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="versionName">Version Name</Label>
            <Input
              id="versionName"
              value={versionName}
              onChange={(e) => {
                // Allow letters, numbers, spaces and underscore only
                const cleaned = e.target.value.replace(/[^\w\s]/g, '')
                setVersionName(cleaned)
              }}
              placeholder="e.g., Multi Faces Detection"
            />
            <p className="text-xs text-muted-foreground">
              Descriptive name for this version (optional). Allowed characters: letters, numbers, spaces, and underscore (_).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Bug fixes and improvements"
            />
            <p className="text-xs text-muted-foreground">
              Release notes or description (optional)
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  {mode === "add" ? "Creating..." : "Updating..."}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {mode === "add" ? "Create Version" : "Update Version"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
