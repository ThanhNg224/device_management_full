import { getTokenStorage } from "./get-token-storage";
import { VersionRepositoryImpl } from "../features/versions/data/version-repository-impl";
import { ListVersionsUseCase } from "../features/versions/domain/list-versions-use-case";
import { CreateVersionUseCase } from "../features/versions/domain/create-version-use-case";
import { UpdateVersionUseCase } from "../features/versions/domain/update-version-use-case";
import { DeleteVersionUseCase } from "../features/versions/domain/delete-version-use-case";
import { InstallVersionOnDevicesUseCase } from "../features/versions/domain/install-version-on-devices-use-case";
import { ClearCorruptedVersionsUseCase } from "../features/versions/domain/clear-corrupted-versions-use-case";
import { VersionsController } from "../features/versions/presentation/versions-controller";

export function makeVersionsController(): VersionsController {
  const tokenStorage = getTokenStorage();
  const versionRepository = new VersionRepositoryImpl(tokenStorage);

  const listVersionsUseCase = new ListVersionsUseCase(versionRepository);
  const createVersionUseCase = new CreateVersionUseCase(versionRepository);
  const updateVersionUseCase = new UpdateVersionUseCase(versionRepository);
  const deleteVersionUseCase = new DeleteVersionUseCase(versionRepository);
  const installVersionOnDevicesUseCase = new InstallVersionOnDevicesUseCase(versionRepository);
  const clearCorruptedVersionsUseCase = new ClearCorruptedVersionsUseCase(versionRepository);

  return new VersionsController(
    listVersionsUseCase,
    createVersionUseCase,
    updateVersionUseCase,
    deleteVersionUseCase,
    installVersionOnDevicesUseCase,
    clearCorruptedVersionsUseCase,
  );
}

