import { buildApiUrl } from "../../../core/config/api";
import { apiFetch } from "../../../core/datasources/http/authenticated-fetch";
import type { StoredUser, TokenStorage } from "../../../core/datasources/auth/token-storage";
import type { AuthRepository } from "../domain/auth-repository";
import type { Session } from "../domain/session";
import type { User } from "../domain/user";

interface LoginResponseDto {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    role: "admin" | "user";
  };
  message?: string;
  error?: string;
}

interface LogoutResponseDto {
  success?: boolean;
  message?: string;
  error?: string;
}

export class AuthRepositoryImpl implements AuthRepository {
  constructor(private readonly tokenStorage: TokenStorage) {}

  async login(input: { username: string; password: string }): Promise<Session> {
    const response = await fetch(buildApiUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: input.username.trim(),
        password: input.password.trim(),
      }),
    });

    let data: LoginResponseDto | null = null;
    try {
      data = (await response.json()) as LoginResponseDto;
    } catch {
      data = null;
    }

    if (!response.ok || !data?.accessToken) {
      const message = data?.message || data?.error || response.statusText || "Login failed";
      throw new Error(message);
    }

    this.tokenStorage.setAccessToken(data.accessToken);
    this.tokenStorage.setRefreshToken(data.refreshToken || null);
    this.tokenStorage.setUser(data.user satisfies StoredUser);

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.tokenStorage.getRefreshToken();
      if (!refreshToken) return;

      await apiFetch(this.tokenStorage, buildApiUrl("/auth/logout"), {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      })
        .then(async (res) => {
          if (res.ok) return;
          const data = (await res.json().catch(() => null)) as LogoutResponseDto | null;
          const message = data?.message || data?.error || `HTTP ${res.status}`;
          throw new Error(message);
        })
        .catch(() => {
          // Logout errors are not critical; always clear local session.
        });
    } finally {
      this.tokenStorage.clear();
    }
  }

  getUser(): User | null {
    return this.tokenStorage.getUser();
  }

  isAuthenticated(): boolean {
    const token = this.tokenStorage.getAccessToken();
    return Boolean(token && token.trim().length > 0);
  }
}
