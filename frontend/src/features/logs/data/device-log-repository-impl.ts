import type { TokenStorage } from "../../../core/datasources/auth/token-storage";
import type { DeviceLog } from "../domain/device-log";
import type { DeviceLogRepository } from "../domain/device-log-repository";
import { DeviceLogsHttpDataSource } from "../datasources/device-logs-http-datasource";
import { mockDeviceLogs } from "../datasources/mock/mock-device-logs";

function toDeviceLog(log: {
  serial?: string;
  fullName?: string;
  accessType?: string;
  accessTime?: string;
  errorMessage?: string;
  scoreMatch?: number;
}): DeviceLog {
  return {
    deviceCode: log.serial || "Unknown",
    fullName: log.fullName || "Unknown",
    accessType: log.accessType || "0",
    time: log.accessTime || "N/A",
    result: log.errorMessage || "Unknown",
    similarity: log.scoreMatch ? `${(log.scoreMatch * 100).toFixed(2)}%` : "N/A",
    note: log.errorMessage || "No additional information",
  };
}

export class DeviceLogRepositoryImpl implements DeviceLogRepository {
  private readonly httpDataSource: DeviceLogsHttpDataSource;

  constructor(tokenStorage: TokenStorage) {
    this.httpDataSource = new DeviceLogsHttpDataSource(tokenStorage);
  }

  async listDeviceLogs(): Promise<DeviceLog[]> {
    try {
      const logs = await this.httpDataSource.listLogs();
      return (Array.isArray(logs) ? logs : [])
        .map(toDeviceLog)
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    } catch (error) {
      console.error("Failed to fetch device logs:", error);
      return mockDeviceLogs;
    }
  }
}

