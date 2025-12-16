import type { Session } from "./session";
import type { User } from "./user";

export interface AuthRepository {
  login(input: { username: string; password: string }): Promise<Session>;
  logout(): Promise<void>;
  getUser(): User | null;
  isAuthenticated(): boolean;
}

