import type { Version } from "./version";

export interface VersionRepository {
  listVersions(): Promise<Version[]>;
  createVersion(input: { file: File; versionCode: string; versionName?: string; note?: string }): Promise<Version>;
  updateVersion(input: { id: string; versionName?: string; note?: string }): Promise<Version>;
  deleteVersion(input: { id: string }): Promise<void>;
  installVersionOnDevices(input: { versionId: string; deviceCodes: string[] }): Promise<{ ok: string[]; failed: string[] }>;
  clearCorruptedVersions(): Promise<void>;
}

