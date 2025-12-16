import type { DeviceLog } from "../domain/device-log";
import type { ListDeviceLogsUseCase } from "../domain/list-device-logs-use-case";

export class DeviceLogsController {
  constructor(private readonly listDeviceLogsUseCase: ListDeviceLogsUseCase) {}

  async listDeviceLogs(): Promise<DeviceLog[]> {
    return this.listDeviceLogsUseCase.execute();
  }
}

