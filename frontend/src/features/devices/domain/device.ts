export type DeviceStatus = "Online" | "Offline";

export interface DevicePerformance {
  cpu: number;
  ram: number;
  temperature: number;
}

export interface DeviceConfig {
  volume: number;
  brightness: number;
}

export interface Device {
  deviceCode: string;
  status: DeviceStatus;
  lastConnected: string;
  location: string;
  version: string;
  ipAddress: string;
  lastPerformance: DevicePerformance;

  unitCompany: string;
  deviceName: string;
  description: string;
  imei: string;
  serverAddress: string;
  macAddress: string;
  temperatureThreshold: number;
  faceThreshold: number;
  distance: number;
  language: string;
  area: string;
  autoReboot: boolean;

  soundEnabled?: boolean;
  ledEnabled?: boolean;
  config: DeviceConfig;
}

