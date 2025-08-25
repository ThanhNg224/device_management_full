import type { Device, DeviceLog, VersionDTO } from "../types"

// API Response interfaces
interface VersionApiResponse {
  id?: string
  versionCode?: string
  version_code?: string
  versionName?: string | null
  version_name?: string | null
  fileUrl?: string
  file_url?: string
  fileSize?: number | null
  file_size?: number | null
  sha256?: string | null
  note?: string | null
  createdAt?: string
  created_at?: string
  status?: number
  statusTitle?: string | null
  status_title?: string | null
}

interface VersionsApiResponse {
  message?: string
  data?: VersionApiResponse[]
}

interface DeviceApiResponse {
  deviceCode?: string
  status?: number | string
  lastConnected?: string
  location?: string
  version?: string
  lastPerformance?: {
    cpu?: number
    ram?: number
    temperature?: number
    temp?: number // Backward compatibility field
  }
  unitCompany?: string
  deviceName?: string
  description?: string
  imei?: string
  serverAddress?: string
  macAddress?: string
  temperatureThreshold?: number
  faceThreshold?: number
  distance?: number
  language?: string
  area?: string
  autoReboot?: boolean
  soundEnabled?: boolean
  ledEnabled?: boolean
  config?: {
    volume?: number
    brightness?: number
  }
}

interface LogApiResponse {
  serial?: string
  fullName?: string
  accessType?: string
  accessTime?: string
  errorMessage?: string
  scoreMatch?: number
}

/**
 * Helper function to get the API base URL from environment variables
 * In production, this MUST be set via NEXT_PUBLIC_API_URL
 * In development, falls back to localhost:3000
 */
function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  
  // In production, we should always have the environment variable set
  if (process.env.NODE_ENV === 'production' && !apiUrl) {
    console.error('NEXT_PUBLIC_API_URL is not set in production environment!')
    throw new Error('API URL configuration missing in production')
  }
  
  // Development fallback
  return apiUrl || 'http://localhost:3000'
}

/**
 * Helper function to build API URLs consistently
 * @param endpoint - The API endpoint path (should start with /)
 * @returns Complete API URL
 */
function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}${endpoint}`
}

export async function fetchDevices(): Promise<Device[]> {
  try {
    // Using environment variable for API URL with fallback to relative path for Next.js rewrites
    const apiUrl = process.env.NEXT_PUBLIC_API_URL 
      ? buildApiUrl('/api/device/listDevice')
      : "/api/device/listDevice"
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    let devices = []
    // Ensure we return an array
    if (Array.isArray(data)) {
      devices = data
    } else if (data && Array.isArray(data.devices)) {
      devices = data.devices
    } else if (data && Array.isArray(data.data)) {
      devices = data.data
    } else {
      console.warn("API response is not in expected format:", data)
      throw new Error("Invalid data format from API")
    }

    // Transform backend data to match frontend interface
    const transformedDevices = devices.map((device: DeviceApiResponse) => ({
      ...device,
      // Convert numeric status to string
      status: device.status === 1 ? "Online" : "Offline",
      // Ensure lastPerformance always has valid numbers
      lastPerformance: {
        cpu: Number(device.lastPerformance?.cpu) || 0,
        ram: Number(device.lastPerformance?.ram) || 0,
        temperature: (() => {
          // Handle both 'temp' and 'temperature' fields for backward compatibility
          const tempValue = Number(device.lastPerformance?.temperature || device.lastPerformance?.temp) || 0;
          // Special case: if temperature is -127 (sensor error), default to 30°C
          return tempValue === -127 ? 30 : tempValue;
        })(),
      },
      // Provide default values for missing fields
      unitCompany: device.unitCompany || "N/A",
      deviceName: device.deviceName || device.deviceCode,
      description: device.description || "No description available",
      imei: device.imei || "N/A",
      serverAddress: device.serverAddress || "N/A",
      macAddress: device.macAddress || "N/A",
      temperatureThreshold: device.temperatureThreshold || 0,
      faceThreshold: device.faceThreshold || 0,
      distance: device.distance || 0,
      language: device.language || "N/A",
      area: device.area || "N/A",
      autoReboot: device.autoReboot || false,
    }))

    return transformedDevices
  } catch (error) {
    console.error("Failed to fetch devices:", error)
    
    // Return mock data as fallback
    const { mockDevices } = await import("../data/devicesMock")
    return mockDevices
  }
}

export async function uploadApk(file: File, deviceSerial: string): Promise<{ downloadUrl: string }> {
  try {
    const formData = new FormData()
    formData.append('fileApk', file)
    formData.append('devices', JSON.stringify([{ serial: deviceSerial }]))

    // Using environment variable for API URL with fallback
    const response = await fetch(buildApiUrl('/api/upload-apk'), {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(20000), // 20 second timeout for file upload
    })

    if (!response.ok) {
      throw new Error(`Upload failed! status: ${response.status}`)
    }

    const result = await response.json()
    const downloadUrl = result.downloadUrl
    
    if (!downloadUrl) {
      throw new Error("Invalid response: missing downloadUrl")
    }

    return { downloadUrl }
  } catch (error) {
    console.error("Failed to upload APK:", error)
    throw error
  }
}

export async function fetchDeviceLogs(): Promise<DeviceLog[]> {
  try {
    // Using environment variable for API URL with fallback
    const response = await fetch(buildApiUrl('/api/deviceLog/getListDeviceLog'), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    // Ensure we return an array
    const logs = Array.isArray(data) ? data : []
    
    // Transform and sort the logs
    const transformedLogs = logs
      .map((log: LogApiResponse) => ({
        deviceCode: log.serial || "Unknown", // Use serial field as Device Code
        fullName: log.fullName || "Unknown",
        accessType: log.accessType || "0",
        time: log.accessTime || "N/A",
        result: log.errorMessage || "Unknown",
        similarity: log.scoreMatch ? `${(log.scoreMatch * 100).toFixed(2)}%` : "N/A",
        note: log.errorMessage || "No additional information"
      }))
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()) // Sort by time descending

    return transformedLogs
  } catch (error) {
    console.error("Failed to fetch device logs:", error)

    // Return mock data as fallback
    const { mockLogs } = await import("../data/logsMock")
    return mockLogs
  }
}

// Version Management API Functions

/**
 * Fetch all versions from the backend
 */
export async function fetchVersions(): Promise<VersionDTO[]> {
  try {
    const url = buildApiUrl("/api/versions")
    console.log("Fetching versions from:", url)
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store"
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch versions: ${response.status}`)
    }

    const apiResponse: VersionsApiResponse = await response.json()
    console.log("Raw API response:", apiResponse)
    
    // Transform API response to our VersionDTO format
    let versionsData: VersionApiResponse[] = []
    if (apiResponse.data && Array.isArray(apiResponse.data)) {
      versionsData = apiResponse.data
    } else if (Array.isArray(apiResponse)) {
      versionsData = apiResponse as VersionApiResponse[]
    } else {
      throw new Error("Unexpected API response format")
    }

    const versions: VersionDTO[] = versionsData.map((item: VersionApiResponse) => ({
      id: item.id || `version-${Date.now()}-${Math.random()}`,
      version_code: item.versionCode || item.version_code || "0.0.0",
      version_name: item.versionName || item.version_name || null,
      file_url: item.fileUrl || item.file_url || "",
      file_size: item.fileSize || item.file_size || null,
      sha256: item.sha256 || null,
      note: item.note || null,
      created_at: item.createdAt || item.created_at || new Date().toISOString(),
      status: typeof item.status === 'number' ? item.status : 0,
      statusTitle: item.statusTitle || item.status_title || null
    }))
    
    console.log("Versions transformed successfully:", versions.length)
    
    return versions
  } catch (error) {
    console.error("Failed to fetch versions:", error)
    
    // Return mock data as fallback
    const { mockVersions } = await import("../data/versionsMock")
    console.log("Using mock versions data:", mockVersions.length)
    return mockVersions
  }
}

/**
 * Create a new version with file upload
 */
export async function createVersion({
  file,
  versionCode,
  versionName,
  note
}: {
  file: File
  versionCode: string
  versionName?: string
  note?: string
}): Promise<VersionDTO> {
  try {
    const url = buildApiUrl("/api/versions")
    console.log("Creating version at:", url)
    
    const formData = new FormData()
    formData.append("file", file)
    formData.append("versionCode", versionCode)
    if (versionName) {
      formData.append("versionName", versionName)
    }
    if (note) {
      formData.append("note", note)
    }

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to create version: ${response.status}`)
    }

    const apiResponse: { data?: VersionApiResponse } & VersionApiResponse = await response.json()
    console.log("Version creation API response:", apiResponse)
    
    // Transform API response to our VersionDTO format
    let versionData: VersionApiResponse = apiResponse
    if (apiResponse.data) {
      versionData = apiResponse.data
    }
    
    const version: VersionDTO = {
      id: versionData.id || `version-${Date.now()}`,
      version_code: versionData.versionCode || versionData.version_code || versionCode,
      version_name: versionData.versionName || versionData.version_name || versionName || null,
      file_url: versionData.fileUrl || versionData.file_url || "",
      file_size: versionData.fileSize || versionData.file_size || null,
      sha256: versionData.sha256 || null,
      note: versionData.note || null,
      created_at: versionData.createdAt || versionData.created_at || new Date().toISOString(),
      status: typeof versionData.status === 'number' ? versionData.status : 1,
      statusTitle: versionData.statusTitle || versionData.status_title || null
    }
    
    console.log("Version created successfully:", version)
    
    return version
  } catch (error) {
    console.error("Failed to create version:", error)
    
    // Return mock success for testing
    console.log("Using mock version creation")
    const mockVersion: VersionDTO = {
      id: `version-${Date.now()}`,
      version_code: versionCode,
      version_name: versionName || null,
      file_url: `https://mock.example.com/${file.name}`,
      file_size: file.size,
      sha256: `mock-sha256-${Date.now()}`,
      note: note || null,
      created_at: new Date().toISOString(),
      status: 1,
      statusTitle: null
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    return mockVersion
  }
}

/**
 * Update an existing version (version_name and note only)
 */
export async function updateVersion(
  id: string,
  data: {
    version_name?: string
    note?: string
  }
): Promise<VersionDTO> {
  try {
    const url = buildApiUrl(`/api/versions/${id}`)
    console.log("Updating version at:", url)
    
    // Transform field names to match API expectations
    const apiData = {
      ...(data.version_name !== undefined && { versionName: data.version_name }),
      ...(data.note !== undefined && { note: data.note })
    }
    
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to update version: ${response.status}`)
    }

    const apiResponse: { data?: VersionApiResponse } & VersionApiResponse = await response.json()
    console.log("Version update API response:", apiResponse)
    
    // Transform API response to our VersionDTO format
    let versionData: VersionApiResponse = apiResponse
    if (apiResponse.data) {
      versionData = apiResponse.data
    }
    
    const version: VersionDTO = {
      id: versionData.id || id,
      version_code: versionData.versionCode || versionData.version_code || "0.0.0",
      version_name: versionData.versionName || versionData.version_name || null,
      file_url: versionData.fileUrl || versionData.file_url || "",
      file_size: versionData.fileSize || versionData.file_size || null,
      sha256: versionData.sha256 || null,
      note: versionData.note || null,
      created_at: versionData.createdAt || versionData.created_at || new Date().toISOString(),
      status: typeof versionData.status === 'number' ? versionData.status : 1,
      statusTitle: versionData.statusTitle || versionData.status_title || null
    }
    
    console.log("Version updated successfully:", version)
    
    return version
  } catch (error) {
    console.error("Failed to update version:", error)
    
    // Return mock success for testing
    console.log("Using mock version update")
    const { mockVersions } = await import("../data/versionsMock")
    const existingVersion = mockVersions.find(v => v.id === id)
    
    if (!existingVersion) {
      throw new Error("Version not found")
    }
    
    const updatedVersion: VersionDTO = {
      ...existingVersion,
      version_name: data.version_name !== undefined ? data.version_name : existingVersion.version_name,
      note: data.note !== undefined ? data.note : existingVersion.note
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return updatedVersion
  }
}

/**
 * Delete a version
 */
export async function deleteVersion(id: string): Promise<void> {
  try {
    const url = buildApiUrl(`/api/versions/${id}`)
    console.log("Deleting version at:", url)
    
    const response = await fetch(url, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to delete version: ${response.status}`)
    }

    console.log("Version deleted successfully")
  } catch (error) {
    console.error("Failed to delete version:", error)
    
    // Mock success for testing
    console.log("Using mock version deletion")
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Mock successful deletion (no return needed for void function)
  }
}

/**
 * Install version on selected devices
 */
export async function installVersionOnDevices(
  versionId: string,
  deviceCodes: string[]
): Promise<{ ok: string[]; failed: string[] }> {
  try {
    const url = buildApiUrl(`/api/versions/${versionId}/install`)
    console.log("Installing version on devices at:", url)
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deviceCodes }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to install version: ${response.status}`)
    }

    const apiResponse = await response.json()
    console.log("Version installation API response:", apiResponse)
    
    // Transform backend response to expected format
    // Backend returns: { success: true, versionId: string, sentDevices: string[] }
    // Frontend expects: { ok: string[], failed: string[] }
    if (apiResponse.success && apiResponse.sentDevices) {
      const sentDevices = apiResponse.sentDevices || []
      const failedDevices = deviceCodes.filter(device => !sentDevices.includes(device))
      
      const result = {
        ok: sentDevices,
        failed: failedDevices
      }
      
      console.log("Transformed installation result:", result)
      return result
    } else {
      // If response doesn't match expected format, treat all as failed
      return {
        ok: [],
        failed: deviceCodes
      }
    }
  } catch (error) {
    console.error("Failed to install version:", error)
    
    // Mock installation result for testing
    console.log("Using mock version installation")
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock result - most succeed, some might fail for testing
    const totalDevices = deviceCodes.length
    const failedCount = Math.floor(Math.random() * Math.max(1, totalDevices * 0.2)) // 0-20% failure rate
    const failedDevices = deviceCodes.slice(0, failedCount)
    const successDevices = deviceCodes.slice(failedCount)
    
    const mockResult = {
      ok: successDevices,
      failed: failedDevices
    }
    
    console.log("Mock installation result:", mockResult)
    return mockResult
  }
}