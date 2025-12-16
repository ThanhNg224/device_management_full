export type StoredUserRole = "admin" | "user";

export interface StoredUser {
  id: string;
  username: string;
  displayName: string;
  role: StoredUserRole;
}

export interface TokenStorage {
  getAccessToken(): string | null;
  setAccessToken(token: string | null): void;

  getRefreshToken(): string | null;
  setRefreshToken(token: string | null): void;

  getUser(): StoredUser | null;
  setUser(user: StoredUser | null): void;

  clear(): void;
}

