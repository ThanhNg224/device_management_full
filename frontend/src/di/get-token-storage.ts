import { LocalStorageTokenStorage } from "../core/datasources/auth/local-storage-token-storage";
import type { TokenStorage } from "../core/datasources/auth/token-storage";

let tokenStorageSingleton: TokenStorage | null = null;

export function getTokenStorage(): TokenStorage {
  if (!tokenStorageSingleton) {
    tokenStorageSingleton = new LocalStorageTokenStorage();
  }
  return tokenStorageSingleton;
}

