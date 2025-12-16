import type { TokenStorage } from "../../../core/datasources/auth/token-storage";
import type { Device, DeviceStatus } from "../domain/device";
import type { DeviceRepository } from "../domain/device-repository";
import { DeviceHttpDataSource, type DeviceApiResponse } from "../datasources/device-http-datasource";
import { mockDevices } from "../datasources/mock/mock-devices";

function coerceStatus(status: DeviceApiResponse["status"]): DeviceStatus {
  if (status === 1 || status === "Online") return "Online";
  return "Offline";
}

function coerceTemperature(raw?: number): number {
  const value = Number(raw) || 0;
  return value === -127 ? 30 : value;
}

function toDevice(device: DeviceApiResponse): Device {
  const deviceCode = device.deviceCode || "Unknown";
  const lastPerformance = device.lastPerformance || {};

  return {
    deviceCode,
    status: coerceStatus(device.status),
    lastConnected: device.lastConnected || "N/A",
    location: device.location || "N/A",
    version: device.version || "N/A",
    ipAddress: device.ipAddress || "N/A",
    lastPerformance: {
      cpu: Number(lastPerformance.cpu) || 0,
      ram: Number(lastPerformance.ram) || 0,
      temperature: coerceTemperature(lastPerformance.temperature ?? lastPerformance.temp),
    },
    unitCompany: device.unitCompany || "N/A",
    deviceName: device.deviceName || deviceCode,
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
    soundEnabled: device.soundEnabled,
    ledEnabled: device.ledEnabled,
    config: {
      volume: device.config?.volume ?? 0,
      brightness: device.config?.brightness ?? 0,
    },
  };
}

function extractDeviceArray(payload: unknown): DeviceApiResponse[] {
  if (Array.isArray(payload)) return payload as DeviceApiResponse[];
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.devices)) return record.devices as DeviceApiResponse[];
    if (Array.isArray(record.data)) return record.data as DeviceApiResponse[];
  }
  throw new Error("Invalid data format from API");
}

export class DeviceRepositoryImpl implements DeviceRepository {
  private readonly httpDataSource: DeviceHttpDataSource;

  constructor(tokenStorage: TokenStorage) {
    this.httpDataSource = new DeviceHttpDataSource(tokenStorage);
  }

  async listDevices(): Promise<Device[]> {
    try {
      const payload = await this.httpDataSource.listDevices();
      return extractDeviceArray(payload).map(toDevice);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
      return mockDevices;
    }
  }

  async uploadApk(input: { file: File; deviceCode: string }): Promise<{ downloadUrl: string }> {
    return this.httpDataSource.uploadApk(input);
  }

  async rebootDevice(input: { deviceCode: string }): Promise<void> {
    await this.httpDataSource.rebootDevice(input);
  }
}
