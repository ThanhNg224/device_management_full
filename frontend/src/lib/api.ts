export async function fetchDevices() {
  try {
    const response = await fetch("/api/device/listDevice", {
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
    const transformedDevices = devices.map((device: any) => ({
      ...device,
      // Convert numeric status to string
      status: device.status === 1 ? "Online" : "Offline",
      // Fix CPU usage - multiply by 10 to get correct percentage
      lastPerformance: {
        ...device.lastPerformance,
        cpu: Math.round((device.lastPerformance?.cpu || 0) * 100) / 100, // Multiply by 100 and round to 2 decimal places
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

export async function uploadApk(file: File, deviceSerial: string): Promise<{ apkUrl: string }> {
  try {
    const formData = new FormData()
    formData.append('fileApk', file)
    formData.append('devices', JSON.stringify([{ serial: deviceSerial }]))

    const response = await fetch('http://192.168.1.157:3000/api/upload-apk', {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(30000), // 30 second timeout for file upload
    })

    if (!response.ok) {
      throw new Error(`Upload failed! status: ${response.status}`)
    }

    const result = await response.json()
    const apkUrl = result.apkUrl
    
    if (!apkUrl) {
      throw new Error("Invalid response: missing apkUrl")
    }

    return { apkUrl }
  } catch (error) {
    console.error("Failed to upload APK:", error)
    throw error
  }
}

export async function fetchDeviceLogs() {
  try {
    const response = await fetch("http://192.168.1.157:3000/api/deviceLog/getListDeviceLog", {
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
      .map((log: any) => ({
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