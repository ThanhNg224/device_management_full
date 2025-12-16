import { buildApiUrl } from "../../../core/config/api";
import { apiFetch, apiFetchJson } from "../../../core/datasources/http/authenticated-fetch";
import type { TokenStorage } from "../../../core/datasources/auth/token-storage";

export interface VersionApiResponse {
  id?: string;
  versionCode?: string;
  version_code?: string;
  versionName?: string | null;
  version_name?: string | null;
  fileUrl?: string;
  file_url?: string;
  fileSize?: number | null;
  file_size?: number | null;
  sha256?: string | null;
  note?: string | null;
  createdAt?: string;
  created_at?: string;
  status?: number;
  statusTitle?: string | null;
  status_title?: string | null;
}

export interface VersionsApiResponse {
  message?: string;
  data?: VersionApiResponse[];
}

export class VersionsHttpDataSource {
  constructor(private readonly tokenStorage: TokenStorage) {}

  async listVersions(): Promise<VersionsApiResponse | VersionApiResponse[]> {
    return apiFetchJson<VersionsApiResponse | VersionApiResponse[]>(this.tokenStorage, buildApiUrl("/api/versions"), {
      method: "GET",
      cache: "no-store",
    });
  }

  async createVersion(input: {
    file: File;
    versionCode: string;
    versionName?: string;
    note?: string;
  }): Promise<unknown> {
    const formData = new FormData();
    formData.append("file", input.file);
    formData.append("versionCode", input.versionCode);
    if (input.versionName) formData.append("versionName", input.versionName);
    if (input.note) formData.append("note", input.note);

    const response = await apiFetch(this.tokenStorage, buildApiUrl("/api/versions"), {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = (data as { message?: string } | null)?.message || `HTTP ${response.status}`;
      throw new Error(message);
    }
    return data;
  }

  async updateVersion(input: { id: string; versionName?: string; note?: string }): Promise<unknown> {
    const apiData = {
      ...(input.versionName !== undefined && { versionName: input.versionName }),
      ...(input.note !== undefined && { note: input.note }),
    };

    return apiFetchJson<unknown>(this.tokenStorage, buildApiUrl(`/api/versions/${input.id}`), {
      method: "PUT",
      body: JSON.stringify(apiData),
    });
  }

  async deleteVersion(input: { id: string }): Promise<void> {
    await apiFetchJson<unknown>(this.tokenStorage, buildApiUrl(`/api/versions/${input.id}`), {
      method: "DELETE",
    });
  }

  async installVersionOnDevices(input: { versionId: string; deviceCodes: string[] }): Promise<unknown> {
    return apiFetchJson<unknown>(this.tokenStorage, buildApiUrl(`/api/versions/${input.versionId}/install`), {
      method: "POST",
      body: JSON.stringify({ deviceCodes: input.deviceCodes }),
    });
  }

  async clearCorruptedVersions(): Promise<void> {
    await apiFetchJson<unknown>(this.tokenStorage, buildApiUrl("/api/versions/clear"), {
      method: "DELETE",
      body: JSON.stringify({ deletedIds: [] }),
    });
  }
}

