import { getTokenStorage } from "./get-token-storage";
import { AuthRepositoryImpl } from "../features/auth/data/auth-repository-impl";
import { LoginUseCase } from "../features/auth/domain/login-use-case";
import { LogoutUseCase } from "../features/auth/domain/logout-use-case";
import { AuthController } from "../features/auth/presentation/auth-controller";

export function makeAuthController(): AuthController {
  const tokenStorage = getTokenStorage();
  const authRepository = new AuthRepositoryImpl(tokenStorage);
  const loginUseCase = new LoginUseCase(authRepository);
  const logoutUseCase = new LogoutUseCase(authRepository);
  return new AuthController(loginUseCase, logoutUseCase, authRepository);
}

