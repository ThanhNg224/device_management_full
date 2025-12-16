import type { Version } from "./version";
import type { VersionRepository } from "./version-repository";

export class ListVersionsUseCase {
  constructor(private readonly versionRepository: VersionRepository) {}

  async execute(): Promise<Version[]> {
    return this.versionRepository.listVersions();
  }
}

