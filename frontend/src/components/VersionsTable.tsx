"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Upload, Edit2, Trash2, Download } from "lucide-react"
import { fetchVersions, deleteVersion } from "../lib/api"
import { VersionFormModal } from "./VersionFormModal"
import { InstallVersionModal } from "./InstallVersionModal"
import { useToast } from "./Toast"
import type { VersionDTO, Device } from "../types"

interface VersionsTableProps {
  onlineDevices: Device[]
}

export function VersionsTable({ onlineDevices }: VersionsTableProps) {
  const [versions, setVersions] = React.useState<VersionDTO[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = React.useState<string | null>(null)
  
  // Modal states
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [editingVersion, setEditingVersion] = React.useState<VersionDTO | null>(null)
  const [installVersion, setInstallVersion] = React.useState<VersionDTO | null>(null)
  
  const { showToast } = useToast()

  // Helper function to compare semantic versions
  const compareVersions = (a: string, b: string): number => {
    const aParts = a.split('.').map(part => parseInt(part, 10) || 0)
    const bParts = b.split('.').map(part => parseInt(part, 10) || 0)
    
    // Pad arrays to same length
    const maxLength = Math.max(aParts.length, bParts.length)
    while (aParts.length < maxLength) aParts.push(0)
    while (bParts.length < maxLength) bParts.push(0)
    
    // Compare each part
    for (let i = 0; i < maxLength; i++) {
      if (aParts[i] > bParts[i]) return 1
      if (aParts[i] < bParts[i]) return -1
    }
    return 0
  }

  const loadVersions = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchVersions()
      
      // Sort by version_code desc (semantic version), then by created_at desc for ties
      const sortedVersions = data.sort((a, b) => {
        const versionComparison = compareVersions(b.version_code, a.version_code) // Descending
        if (versionComparison !== 0) {
          return versionComparison
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      
      setVersions(sortedVersions)
    } catch (err) {
      console.error("Failed to load versions:", err)
      setError(err instanceof Error ? err.message : "Failed to load versions")
      showToast("Failed to load versions", "error")
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const handleDelete = async (version: VersionDTO) => {
    if (!confirm(`Are you sure you want to delete version ${version.version_code}?`)) {
      return
    }

    try {
      setDeleteLoading(version.id)
      await deleteVersion(version.id)
      showToast("Version deleted successfully", "success")
      await loadVersions()
    } catch (err) {
      console.error("Failed to delete version:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to delete version"
      showToast(errorMessage, "error")
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleVersionCreated = () => {
    setShowAddModal(false)
    loadVersions()
  }

  const handleVersionUpdated = () => {
    setEditingVersion(null)
    loadVersions()
  }

  const handleInstallComplete = () => {
    setInstallVersion(null)
  }

  const formatFileSize = (bytes?: number | null): string => {
    if (!bytes) return "Unknown"
    
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  React.useEffect(() => {
    loadVersions()
  }, [loadVersions])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Versions</CardTitle>
          <CardDescription>Manage APK versions for device installation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Versions</CardTitle>
          <CardDescription>Manage APK versions for device installation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Failed to load versions</p>
            <Button onClick={loadVersions} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Versions</CardTitle>
              <CardDescription>Manage APK versions for device installation</CardDescription>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Add Version
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No versions found</p>
              <Button onClick={() => setShowAddModal(true)} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Add First Version
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version Code</TableHead>
                    <TableHead>Version Name</TableHead>
                    <TableHead>Uploaded At</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell>
                        <Badge variant="secondary">{version.version_code}</Badge>
                      </TableCell>
                      <TableCell>
                        {version.version_name || (
                          <span className="text-muted-foreground italic">No name</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(version.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatFileSize(version.file_size)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {version.note || (
                          <span className="text-muted-foreground italic">No note</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInstallVersion(version)}
                            disabled={onlineDevices.length === 0}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingVersion(version)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(version)}
                            disabled={deleteLoading === version.id}
                          >
                            {deleteLoading === version.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showAddModal && (
        <VersionFormModal
          mode="add"
          onClose={() => setShowAddModal(false)}
          onSuccess={handleVersionCreated}
        />
      )}

      {editingVersion && (
        <VersionFormModal
          mode="edit"
          version={editingVersion}
          onClose={() => setEditingVersion(null)}
          onSuccess={handleVersionUpdated}
        />
      )}

      {installVersion && (
        <InstallVersionModal
          version={installVersion}
          onlineDevices={onlineDevices}
          onClose={() => setInstallVersion(null)}
          onSuccess={handleInstallComplete}
        />
      )}
    </>
  )
}
