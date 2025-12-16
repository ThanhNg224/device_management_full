import type { DeviceLog } from "./device-log";
import type { DeviceLogRepository } from "./device-log-repository";

export class ListDeviceLogsUseCase {
  constructor(private readonly deviceLogRepository: DeviceLogRepository) {}

  async execute(): Promise<DeviceLog[]> {
    return this.deviceLogRepository.listDeviceLogs();
  }
}

