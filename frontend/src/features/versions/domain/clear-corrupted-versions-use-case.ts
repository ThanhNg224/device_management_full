import type { VersionRepository } from "./version-repository";

export class ClearCorruptedVersionsUseCase {
  constructor(private readonly versionRepository: VersionRepository) {}

  async execute(): Promise<void> {
    await this.versionRepository.clearCorruptedVersions();
  }
}

