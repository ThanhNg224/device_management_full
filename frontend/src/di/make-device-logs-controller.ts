import { getTokenStorage } from "./get-token-storage";
import { DeviceLogRepositoryImpl } from "../features/logs/data/device-log-repository-impl";
import { ListDeviceLogsUseCase } from "../features/logs/domain/list-device-logs-use-case";
import { DeviceLogsController } from "../features/logs/presentation/device-logs-controller";

export function makeDeviceLogsController(): DeviceLogsController {
  const tokenStorage = getTokenStorage();
  const deviceLogRepository = new DeviceLogRepositoryImpl(tokenStorage);
  const listDeviceLogsUseCase = new ListDeviceLogsUseCase(deviceLogRepository);
  return new DeviceLogsController(listDeviceLogsUseCase);
}

