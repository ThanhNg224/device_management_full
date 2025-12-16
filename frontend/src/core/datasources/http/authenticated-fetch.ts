import { buildApiUrl } from "../../config/api";
import { AuthenticationRequiredError } from "../../errors/authentication-required-error";
import type { TokenStorage } from "../auth/token-storage";

function isFormDataBody(body: RequestInit["body"]): boolean {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

export async function apiFetch(
  tokenStorage: TokenStorage,
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const accessToken = tokenStorage.getAccessToken();
  const isFormData = isFormDataBody(options.body);

  const headers: HeadersInit = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(options.headers || {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status !== 401) return response;

  if (url.includes("/auth/refresh")) {
    tokenStorage.clear();
    throw new AuthenticationRequiredError();
  }

  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    tokenStorage.clear();
    throw new AuthenticationRequiredError();
  }

  try {
    const refreshResponse = await fetch(buildApiUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshResponse.ok) {
      tokenStorage.clear();
      throw new AuthenticationRequiredError();
    }

    const refreshData = (await refreshResponse.json()) as { accessToken?: string };
    if (!refreshData.accessToken) {
      tokenStorage.clear();
      throw new AuthenticationRequiredError();
    }

    tokenStorage.setAccessToken(refreshData.accessToken);

    const retryHeaders: HeadersInit = {
      ...headers,
      Authorization: `Bearer ${refreshData.accessToken}`,
    };

    return fetch(url, { ...options, headers: retryHeaders });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) throw error;
    tokenStorage.clear();
    throw new AuthenticationRequiredError();
  }
}

export async function apiFetchJson<T>(
  tokenStorage: TokenStorage,
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await apiFetch(tokenStorage, url, options);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

