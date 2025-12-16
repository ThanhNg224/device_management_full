import type { Device } from "./device";

export interface DeviceRepository {
  listDevices(): Promise<Device[]>;
  uploadApk(input: { file: File; deviceCode: string }): Promise<{ downloadUrl: string }>;
  rebootDevice(input: { deviceCode: string }): Promise<void>;
}

