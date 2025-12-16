import type { User } from "./user";

export interface Session {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

