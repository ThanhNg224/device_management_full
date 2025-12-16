import type { Device } from "../domain/device";
import type { ListDevicesUseCase } from "../domain/list-devices-use-case";
import type { UploadApkUseCase } from "../domain/upload-apk-use-case";
import type { RebootDeviceUseCase } from "../domain/reboot-device-use-case";

export class DevicesController {
  constructor(
    private readonly listDevicesUseCase: ListDevicesUseCase,
    private readonly uploadApkUseCase: UploadApkUseCase,
    private readonly rebootDeviceUseCase: RebootDeviceUseCase,
  ) {}

  async listDevices(): Promise<Device[]> {
    return this.listDevicesUseCase.execute();
  }

  async uploadApk(input: { file: File; deviceCode: string }): Promise<{ downloadUrl: string }> {
    return this.uploadApkUseCase.execute(input);
  }

  async rebootDevice(input: { deviceCode: string }): Promise<void> {
    await this.rebootDeviceUseCase.execute(input);
  }
}

