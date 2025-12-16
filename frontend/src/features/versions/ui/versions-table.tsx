"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Upload, Edit2, Trash2, Download, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { makeVersionsController } from "../../../di/make-versions-controller"
import { VersionFormModal } from "./version-form-modal"
import { InstallVersionModal } from "./install-version-modal"
import { useToast } from "../../../core/ui/toast"
import type { Version } from "../domain/version"
import type { Device } from "../../devices/domain/device"

interface VersionsTableProps {
  onlineDevices: Device[]
}

export function VersionsTable({ onlineDevices }: VersionsTableProps) {
  const versionsController = React.useMemo(() => makeVersionsController(), [])
  const [versions, setVersions] = React.useState<Version[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = React.useState<string | null>(null)
  const [clearLoading, setClearLoading] = React.useState(false)
  const [sortColumn, setSortColumn] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  
  // Modal states
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [editingVersion, setEditingVersion] = React.useState<Version | null>(null)
  const [installVersion, setInstallVersion] = React.useState<Version | null>(null)
  
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

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown size={12} className="opacity-40" />
    }
    return sortDirection === 'asc'
      ? <ChevronUp size={12} className="text-foreground" />
      : <ChevronDown size={12} className="text-foreground" />
  }

  // Apply sorting to versions
  const sortedVersions = React.useMemo(() => {
    if (!sortColumn) {
      // Default sort by versionCode desc (semantic version), then by createdAt desc for ties
      return [...versions].sort((a, b) => {
        const versionComparison = compareVersions(b.versionCode, a.versionCode)
        if (versionComparison !== 0) {
          return versionComparison
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }

    return [...versions].sort((a, b) => {
      let aValue: string | number | Date
      let bValue: string | number | Date

      switch (sortColumn) {
        case 'versionCode':
          return sortDirection === 'asc' 
            ? compareVersions(a.versionCode, b.versionCode)
            : compareVersions(b.versionCode, a.versionCode)
        case 'versionName':
          aValue = (a.versionName || '').toLowerCase()
          bValue = (b.versionName || '').toLowerCase()
          break
        case 'createdAt':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case 'fileSize':
          aValue = a.fileSize || 0
          bValue = b.fileSize || 0
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default:
          return 0
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        if (sortDirection === 'asc') {
          return aValue.getTime() - bValue.getTime()
        } else {
          return bValue.getTime() - aValue.getTime()
        }
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }, [versions, sortColumn, sortDirection])

  const loadVersions = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await versionsController.listVersions()
      setVersions(data)
    } catch (err) {
      console.error("Failed to load versions:", err)
      setError(err instanceof Error ? err.message : "Failed to load versions")
      showToast("Failed to load versions", "error")
    } finally {
      setLoading(false)
    }
  }, [showToast, versionsController])

  const handleDelete = async (version: Version) => {
    if (!confirm(`Are you sure you want to delete version ${version.versionCode}?`)) {
      return
    }

    try {
      setDeleteLoading(version.id)
      await versionsController.deleteVersion({ id: version.id })
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

  const handleClearCorrupted = async () => {
    try {
      setClearLoading(true)
      await versionsController.clearCorruptedVersions()
      showToast("Corrupted versions cleared successfully", "success")
      await loadVersions()
    } catch (err) {
      console.error("Failed to clear corrupted versions:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to clear corrupted versions"
      showToast(errorMessage, "error")
    } finally {
      setClearLoading(false)
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
      // Handle DD/MM/YYYY HH:mm format from API
      if (dateString.includes('/') && dateString.includes(' ')) {
        const [datePart, timePart] = dateString.split(' ')
        const [day, month, year] = datePart.split('/')
        // Convert to ISO format that JavaScript can parse
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}:00`
        return new Date(isoDate).toLocaleString()
      }
      // Fallback for other formats
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  const getStatusDisplay = (status: number, statusTitle?: string | null) => {
    if (status === 1) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
          Ready
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
          {statusTitle || "Error"}
        </Badge>
      )
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
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleClearCorrupted} 
                variant="destructive"
                disabled={clearLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {clearLoading ? "Clearing..." : "Clear Corrupted Versions"}
              </Button>
              <Button onClick={() => setShowAddModal(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Add Version
              </Button>
            </div>
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
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/20 transition-colors"
                      onClick={() => handleSort('versionCode')}
                    >
                      <div className="flex items-center gap-1">
                        Version Code{getSortIcon('versionCode')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/20 transition-colors"
                      onClick={() => handleSort('versionName')}
                    >
                      <div className="flex items-center gap-1">
                        Version Name{getSortIcon('versionName')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/20 transition-colors"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-1">
                        Uploaded At{getSortIcon('createdAt')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/20 transition-colors"
                      onClick={() => handleSort('fileSize')}
                    >
                      <div className="flex items-center gap-1">
                        File Size{getSortIcon('fileSize')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/20 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status{getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVersions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell>
                        <Badge variant="secondary">{version.versionCode}</Badge>
                      </TableCell>
                      <TableCell>
                        {version.versionName || (
                          <span className="text-muted-foreground italic">No name</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(version.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatFileSize(version.fileSize)}
                      </TableCell>
                      <TableCell>
                        {getStatusDisplay(version.status, version.statusTitle)}
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
          existingVersions={versions}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleVersionCreated}
        />
      )}

      {editingVersion && (
        <VersionFormModal
          mode="edit"
          version={editingVersion}
          existingVersions={versions}
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
