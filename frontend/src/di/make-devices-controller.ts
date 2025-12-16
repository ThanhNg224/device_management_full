import { getTokenStorage } from "./get-token-storage";
import { DeviceRepositoryImpl } from "../features/devices/data/device-repository-impl";
import { ListDevicesUseCase } from "../features/devices/domain/list-devices-use-case";
import { UploadApkUseCase } from "../features/devices/domain/upload-apk-use-case";
import { RebootDeviceUseCase } from "../features/devices/domain/reboot-device-use-case";
import { DevicesController } from "../features/devices/presentation/devices-controller";

export function makeDevicesController(): DevicesController {
  const tokenStorage = getTokenStorage();
  const deviceRepository = new DeviceRepositoryImpl(tokenStorage);
  const listDevicesUseCase = new ListDevicesUseCase(deviceRepository);
  const uploadApkUseCase = new UploadApkUseCase(deviceRepository);
  const rebootDeviceUseCase = new RebootDeviceUseCase(deviceRepository);
  return new DevicesController(listDevicesUseCase, uploadApkUseCase, rebootDeviceUseCase);
}

