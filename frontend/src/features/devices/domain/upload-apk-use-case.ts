import type { DeviceRepository } from "./device-repository";

export class UploadApkUseCase {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  async execute(input: { file: File; deviceCode: string }): Promise<{ downloadUrl: string }> {
    return this.deviceRepository.uploadApk(input);
  }
}

