import type { DeviceRepository } from "./device-repository";

export class RebootDeviceUseCase {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  async execute(input: { deviceCode: string }): Promise<void> {
    await this.deviceRepository.rebootDevice(input);
  }
}

