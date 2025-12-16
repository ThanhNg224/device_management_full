import type { Device } from "./device";
import type { DeviceRepository } from "./device-repository";

export class ListDevicesUseCase {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  async execute(): Promise<Device[]> {
    return this.deviceRepository.listDevices();
  }
}

