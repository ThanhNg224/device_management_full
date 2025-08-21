"use client"

import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Upload } from "lucide-react"
import { createVersion, updateVersion } from "../lib/api"
import { useToast } from "./Toast"
import type { VersionDTO } from "../types"

interface VersionFormModalProps {
  mode: "add" | "edit"
  version?: VersionDTO
  onClose: () => void
  onSuccess: () => void
}

export function VersionFormModal({ mode, version, onClose, onSuccess }: VersionFormModalProps) {
  const [loading, setLoading] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [versionCode, setVersionCode] = React.useState(
    mode === "edit" ? version?.version_code || "" : ""
  )
  const [versionName, setVersionName] = React.useState(
    mode === "edit" ? version?.version_name || "" : ""
  )
  const [note, setNote] = React.useState(
    mode === "edit" ? version?.note || "" : ""
  )

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
    
    if (mode === "add") {
      // Validation for add mode
      if (!file) {
        showToast("Please select an APK file", "error")
        return
      }
      
      if (!versionCode.trim()) {
        showToast("Please enter a version code", "error")
        return
      }

      // Validate semantic version format (x.y.z)
      const versionRegex = /^\d+\.\d+\.\d+$/
      if (!versionRegex.test(versionCode.trim())) {
        showToast("Version code must be in format x.y.z (e.g., 1.3.6)", "error")
        return
      }
    }

    try {
      setLoading(true)

      if (mode === "add") {
        await createVersion({
          file: file!,
          versionCode: versionCode.trim(),
          versionName: versionName.trim() || undefined,
          note: note.trim() || undefined,
        })
        showToast("Version created successfully", "success")
      } else {
        if (!version?.id) {
          throw new Error("Version ID is required for editing")
        }
        
        await updateVersion(version.id, {
          version_name: versionName.trim() || undefined,
          note: note.trim() || undefined,
        })
        showToast("Version updated successfully", "success")
      }

      onSuccess()
    } catch (err) {
      console.error(`Failed to ${mode} version:`, err)
      let errorMessage = `Failed to ${mode} version`
      
      if (err instanceof Error) {
        if (err.message.includes("already exists") || err.message.includes("duplicate")) {
          errorMessage = "Version code already exists"
        } else {
          errorMessage = err.message
        }
      }
      
      showToast(errorMessage, "error")
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
                  onChange={(e) => setVersionCode(e.target.value)}
                  placeholder="e.g., 1.3.6"
                  required
                />
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
                {version?.version_code} (cannot be changed)
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="versionName">Version Name</Label>
            <Input
              id="versionName"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="e.g., Multi Faces Detection"
            />
            <p className="text-xs text-muted-foreground">
              Descriptive name for this version (optional)
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
