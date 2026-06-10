import type { DataRepository } from './data-repository';
import { apiRepository } from './api-repository';
import { localStorageRepository } from './local-storage-repository';

export type DataRepositoryMode = 'local' | 'api';

const DEFAULT_REPOSITORY_MODE: DataRepositoryMode = 'local';

function readRepositoryMode(): DataRepositoryMode {
  const configuredMode = process.env.NEXT_PUBLIC_DATA_REPOSITORY?.trim().toLowerCase();

  if (!configuredMode || configuredMode === 'local') {
    return DEFAULT_REPOSITORY_MODE;
  }

  if (configuredMode === 'api') {
    return 'api';
  }

  console.warn(
    `[dataRepository] NEXT_PUBLIC_DATA_REPOSITORY="${configuredMode}" no es valido. Se usara localStorageRepository.`
  );
  return DEFAULT_REPOSITORY_MODE;
}

export function getDataRepositoryMode(): DataRepositoryMode {
  return readRepositoryMode();
}

export function getDataRepository(): DataRepository {
  const mode = readRepositoryMode();

  if (mode === 'api') {
    return apiRepository;
  }

  return localStorageRepository;
}
