import type { Version } from "./version";
import type { VersionRepository } from "./version-repository";

export class CreateVersionUseCase {
  constructor(private readonly versionRepository: VersionRepository) {}

  async execute(input: {
    file: File;
    versionCode: string;
    versionName?: string;
    note?: string;
  }): Promise<Version> {
    return this.versionRepository.createVersion(input);
  }
}

