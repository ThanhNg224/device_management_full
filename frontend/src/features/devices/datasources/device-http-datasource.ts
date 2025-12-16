import { buildApiUrl, buildApiUrlOrRelative } from "../../../core/config/api";
import { apiFetch, apiFetchJson } from "../../../core/datasources/http/authenticated-fetch";
import type { TokenStorage } from "../../../core/datasources/auth/token-storage";

export interface DeviceApiResponse {
  deviceCode?: string;
  status?: number | string;
  lastConnected?: string;
  location?: string;
  version?: string;
  ipAddress?: string;
  lastPerformance?: {
    cpu?: number;
    ram?: number;
    temperature?: number;
    temp?: number;
  };
  unitCompany?: string;
  deviceName?: string;
  description?: string;
  imei?: string;
  serverAddress?: string;
  macAddress?: string;
  temperatureThreshold?: number;
  faceThreshold?: number;
  distance?: number;
  language?: string;
  area?: string;
  autoReboot?: boolean;
  soundEnabled?: boolean;
  ledEnabled?: boolean;
  config?: {
    volume?: number;
    brightness?: number;
  };
}

interface RebootResponseDto {
  success?: boolean;
  message?: string;
}

export class DeviceHttpDataSource {
  constructor(private readonly tokenStorage: TokenStorage) {}

  async listDevices(): Promise<unknown> {
    const url = buildApiUrlOrRelative("/api/device/listDevice");
    return apiFetchJson<unknown>(this.tokenStorage, url, {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    });
  }

  async uploadApk(input: { file: File; deviceCode: string }): Promise<{ downloadUrl: string }> {
    const formData = new FormData();
    formData.append("fileApk", input.file);
    formData.append("devices", JSON.stringify([{ serial: input.deviceCode }]));

    const response = await apiFetch(this.tokenStorage, buildApiUrl("/api/upload-apk"), {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || `Upload failed! status: ${response.status}`);
    }

    const data = (await response.json()) as { downloadUrl?: string };
    if (!data.downloadUrl) throw new Error("Invalid response: missing downloadUrl");
    return { downloadUrl: data.downloadUrl };
  }

  async rebootDevice(input: { deviceCode: string }): Promise<void> {
    const data = await apiFetchJson<RebootResponseDto>(this.tokenStorage, buildApiUrl("/api/device/reboot"), {
      method: "POST",
      body: JSON.stringify({ deviceCode: input.deviceCode }),
    });

    if (data.success === false) {
      throw new Error(data.message || "Failed to send reboot command");
    }
  }
}

