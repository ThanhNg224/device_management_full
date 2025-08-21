import React from "react"

export interface Device {
  deviceCode: string
  status: "Online" | "Offline" | 0 | 1  // Allow both string and numeric status
  lastConnected: string
  location: string
  version: string
  lastPerformance: {
    cpu: number
    ram: number
    temperature: number
  }
  // Additional fields for modal
  unitCompany: string
  deviceName: string
  description: string
  imei: string
  serverAddress: string
  macAddress: string
  temperatureThreshold: number
  faceThreshold: number
  distance: number
  language: string
  area: string
  autoReboot: boolean
  // Additional device settings
  soundEnabled?: boolean
  ledEnabled?: boolean
  config: {
    volume: number
    brightness: number
  }
}

export interface DeviceLog {
  deviceCode: string
  fullName: string
  accessType: string
  time: string
  result: string
  similarity: string
  note: string
}

export interface NavItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  id: string
}

export interface VersionDTO {
  id: string
  version_code: string // Semantic version like "1.3.6"
  version_name?: string | null // Optional descriptive name like "multi faces detection"
  file_url: string
  file_size?: number | null
  sha256?: string | null
  note?: string | null
  created_at: string // ISO upload timestamp from BE
}
