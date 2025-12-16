import type { Version } from "./version";
import type { VersionRepository } from "./version-repository";

export class UpdateVersionUseCase {
  constructor(private readonly versionRepository: VersionRepository) {}

  async execute(input: { id: string; versionName?: string; note?: string }): Promise<Version> {
    return this.versionRepository.updateVersion(input);
  }
}

