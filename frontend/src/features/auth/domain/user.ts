export type UserRole = "admin" | "user";

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

