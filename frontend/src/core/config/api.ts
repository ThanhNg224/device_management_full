function normalizeEndpoint(endpoint: string): string {
  if (!endpoint) return "/";
  return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
}

/**
 * Gets API base URL from env with safe defaults.
 * In production, NEXT_PUBLIC_API_URL must be set.
 */
export function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (process.env.NODE_ENV === "production" && !apiUrl) {
    throw new Error("API URL configuration missing in production");
  }

  return apiUrl || "http://localhost:3000";
}

/**
 * Builds a full API URL (always absolute, using localhost fallback in development).
 */
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${normalizeEndpoint(endpoint)}`;
}

/**
 * Builds a URL using NEXT_PUBLIC_API_URL when set; otherwise returns a relative path.
 * Useful when relying on Next.js rewrites in development.
 */
export function buildApiUrlOrRelative(endpoint: string): string {
  const normalized = normalizeEndpoint(endpoint);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("API URL configuration missing in production");
    }
    return normalized;
  }

  return `${apiUrl}${normalized}`;
}

