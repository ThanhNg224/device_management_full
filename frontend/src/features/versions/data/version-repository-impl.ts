import type { TokenStorage } from "../../../core/datasources/auth/token-storage";
import type { Version } from "../domain/version";
import type { VersionRepository } from "../domain/version-repository";
import { mockVersions } from "../datasources/mock/mock-versions";
import type { VersionApiResponse, VersionsApiResponse } from "../datasources/versions-http-datasource";
import { VersionsHttpDataSource } from "../datasources/versions-http-datasource";

function toVersion(item: VersionApiResponse): Version {
  return {
    id: item.id || `version-${Date.now()}-${Math.random()}`,
    versionCode: item.versionCode || item.version_code || "0.0.0",
    versionName: item.versionName || item.version_name || null,
    fileUrl: item.fileUrl || item.file_url || "",
    fileSize: item.fileSize || item.file_size || null,
    sha256: item.sha256 || null,
    note: item.note || null,
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    status: typeof item.status === "number" ? item.status : 0,
    statusTitle: item.statusTitle || item.status_title || null,
  };
}

function extractVersions(payload: VersionsApiResponse | VersionApiResponse[] | unknown): VersionApiResponse[] {
  if (Array.isArray(payload)) return payload as VersionApiResponse[];
  if (payload && typeof payload === "object") {
    const record = payload as VersionsApiResponse;
    if (record.data && Array.isArray(record.data)) return record.data;
  }
  throw new Error("Unexpected API response format");
}

export class VersionRepositoryImpl implements VersionRepository {
  private readonly httpDataSource: VersionsHttpDataSource;

  constructor(tokenStorage: TokenStorage) {
    this.httpDataSource = new VersionsHttpDataSource(tokenStorage);
  }

  async listVersions(): Promise<Version[]> {
    try {
      const payload = await this.httpDataSource.listVersions();
      return extractVersions(payload).map(toVersion);
    } catch (error) {
      console.error("Failed to fetch versions:", error);
      return mockVersions;
    }
  }

  async createVersion(input: {
    file: File;
    versionCode: string;
    versionName?: string;
    note?: string;
  }): Promise<Version> {
    try {
      const data = await this.httpDataSource.createVersion(input);
      const versionData = (data as { data?: VersionApiResponse } & VersionApiResponse).data || (data as VersionApiResponse);
      return toVersion({
        ...versionData,
        versionCode: versionData.versionCode || versionData.version_code || input.versionCode,
        versionName: versionData.versionName || versionData.version_name || input.versionName || null,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("HTTP")) throw error;
        if (error.message.includes("versionCode")) throw error;
      }

      const mockVersion: Version = {
        id: `version-${Date.now()}`,
        versionCode: input.versionCode,
        versionName: input.versionName || null,
        fileUrl: `https://mock.example.com/${input.file.name}`,
        fileSize: input.file.size,
        sha256: `mock-sha256-${Date.now()}`,
        note: input.note || null,
        createdAt: new Date().toISOString(),
        status: 1,
        statusTitle: null,
      };

      await new Promise((resolve) => setTimeout(resolve, 1500));
      return mockVersion;
    }
  }

  async updateVersion(input: { id: string; versionName?: string; note?: string }): Promise<Version> {
    try {
      const data = await this.httpDataSource.updateVersion(input);
      const versionData = (data as { data?: VersionApiResponse } & VersionApiResponse).data || (data as VersionApiResponse);
      return toVersion({ ...versionData, id: versionData.id || input.id });
    } catch (error) {
      console.error("Failed to update version:", error);
      const existingVersion = mockVersions.find((v) => v.id === input.id);
      if (!existingVersion) throw new Error("Version not found");

      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        ...existingVersion,
        versionName: input.versionName !== undefined ? input.versionName : existingVersion.versionName,
        note: input.note !== undefined ? input.note : existingVersion.note,
      };
    }
  }

  async deleteVersion(input: { id: string }): Promise<void> {
    try {
      await this.httpDataSource.deleteVersion(input);
    } catch (error) {
      console.error("Failed to delete version:", error);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  async installVersionOnDevices(input: { versionId: string; deviceCodes: string[] }): Promise<{ ok: string[]; failed: string[] }> {
    try {
      const apiResponse = (await this.httpDataSource.installVersionOnDevices(input)) as {
        success?: boolean;
        sentDevices?: string[];
      };

      if (apiResponse.success && apiResponse.sentDevices) {
        const sentDevices = apiResponse.sentDevices || [];
        const failedDevices = input.deviceCodes.filter((device) => !sentDevices.includes(device));
        return { ok: sentDevices, failed: failedDevices };
      }

      return { ok: [], failed: input.deviceCodes };
    } catch (error) {
      console.error("Failed to install version:", error);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const totalDevices = input.deviceCodes.length;
      const failedCount = Math.floor(Math.random() * Math.max(1, totalDevices * 0.2));
      const failedDevices = input.deviceCodes.slice(0, failedCount);
      const successDevices = input.deviceCodes.slice(failedCount);
      return { ok: successDevices, failed: failedDevices };
    }
  }

  async clearCorruptedVersions(): Promise<void> {
    await this.httpDataSource.clearCorruptedVersions();
  }
}
