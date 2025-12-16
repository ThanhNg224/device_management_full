import type { VersionRepository } from "./version-repository";

export class DeleteVersionUseCase {
  constructor(private readonly versionRepository: VersionRepository) {}

  async execute(input: { id: string }): Promise<void> {
    await this.versionRepository.deleteVersion(input);
  }
}

