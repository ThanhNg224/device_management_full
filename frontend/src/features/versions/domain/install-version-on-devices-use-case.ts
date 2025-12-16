import type { VersionRepository } from "./version-repository";

export class InstallVersionOnDevicesUseCase {
  constructor(private readonly versionRepository: VersionRepository) {}

  async execute(input: { versionId: string; deviceCodes: string[] }): Promise<{ ok: string[]; failed: string[] }> {
    return this.versionRepository.installVersionOnDevices(input);
  }
}

