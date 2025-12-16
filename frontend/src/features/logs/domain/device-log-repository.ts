import type { DeviceLog } from "./device-log";

export interface DeviceLogRepository {
  listDeviceLogs(): Promise<DeviceLog[]>;
}

