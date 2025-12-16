import { buildApiUrl } from "../../../core/config/api";
import { apiFetchJson } from "../../../core/datasources/http/authenticated-fetch";
import type { TokenStorage } from "../../../core/datasources/auth/token-storage";

interface LogApiResponse {
  serial?: string;
  fullName?: string;
  accessType?: string;
  accessTime?: string;
  errorMessage?: string;
  scoreMatch?: number;
}

export class DeviceLogsHttpDataSource {
  constructor(private readonly tokenStorage: TokenStorage) {}

  async listLogs(): Promise<LogApiResponse[]> {
    return apiFetchJson<LogApiResponse[]>(this.tokenStorage, buildApiUrl("/api/deviceLog/getListDeviceLog"), {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    });
  }
}

