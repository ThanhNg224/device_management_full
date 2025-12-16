import type { Version } from "../domain/version";
import type { ListVersionsUseCase } from "../domain/list-versions-use-case";
import type { CreateVersionUseCase } from "../domain/create-version-use-case";
import type { UpdateVersionUseCase } from "../domain/update-version-use-case";
import type { DeleteVersionUseCase } from "../domain/delete-version-use-case";
import type { InstallVersionOnDevicesUseCase } from "../domain/install-version-on-devices-use-case";
import type { ClearCorruptedVersionsUseCase } from "../domain/clear-corrupted-versions-use-case";

export class VersionsController {
  constructor(
    private readonly listVersionsUseCase: ListVersionsUseCase,
    private readonly createVersionUseCase: CreateVersionUseCase,
    private readonly updateVersionUseCase: UpdateVersionUseCase,
    private readonly deleteVersionUseCase: DeleteVersionUseCase,
    private readonly installVersionOnDevicesUseCase: InstallVersionOnDevicesUseCase,
    private readonly clearCorruptedVersionsUseCase: ClearCorruptedVersionsUseCase,
  ) {}

  async listVersions(): Promise<Version[]> {
    return this.listVersionsUseCase.execute();
  }

  async createVersion(input: { file: File; versionCode: string; versionName?: string; note?: string }): Promise<Version> {
    return this.createVersionUseCase.execute(input);
  }

  async updateVersion(input: { id: string; versionName?: string; note?: string }): Promise<Version> {
    return this.updateVersionUseCase.execute(input);
  }

  async deleteVersion(input: { id: string }): Promise<void> {
    await this.deleteVersionUseCase.execute(input);
  }

  async installVersionOnDevices(input: {
    versionId: string;
    deviceCodes: string[];
  }): Promise<{ ok: string[]; failed: string[] }> {
    return this.installVersionOnDevicesUseCase.execute(input);
  }

  async clearCorruptedVersions(): Promise<void> {
    await this.clearCorruptedVersionsUseCase.execute();
  }
}

