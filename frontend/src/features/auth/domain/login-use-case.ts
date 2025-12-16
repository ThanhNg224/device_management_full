import type { AuthRepository } from "./auth-repository";
import type { Session } from "./session";

export class LoginUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(input: { username: string; password: string }): Promise<Session> {
    return this.authRepository.login(input);
  }
}

