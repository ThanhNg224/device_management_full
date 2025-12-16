import type { Session } from "../domain/session";
import type { User } from "../domain/user";
import type { LoginUseCase } from "../domain/login-use-case";
import type { LogoutUseCase } from "../domain/logout-use-case";
import type { AuthRepository } from "../domain/auth-repository";

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly authRepository: AuthRepository,
  ) {}

  async login(input: { username: string; password: string }): Promise<Session> {
    return this.loginUseCase.execute(input);
  }

  async logout(): Promise<void> {
    await this.logoutUseCase.execute();
  }

  isAuthenticated(): boolean {
    return this.authRepository.isAuthenticated();
  }

  getUser(): User | null {
    return this.authRepository.getUser();
  }
}

