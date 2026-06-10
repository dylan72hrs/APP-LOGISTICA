import type { DataRepository, PersistedDataSnapshot } from './data-repository';
import type { MockDataSnapshot } from './mock-repository';

let hasWarnedAboutApiRepository = false;

function warnApiRepositoryNotImplemented() {
  if (hasWarnedAboutApiRepository) return;

  hasWarnedAboutApiRepository = true;
  console.warn(
    '[apiRepository] apiRepository aun no esta implementado. Se prepara para una etapa futura y no llama a endpoints reales.'
  );
}

export const apiRepository: DataRepository = {
  load(seed: MockDataSnapshot): MockDataSnapshot {
    warnApiRepositoryNotImplemented();
    return seed;
  },

  save(_snapshot: PersistedDataSnapshot) {
    warnApiRepositoryNotImplemented();
  },
};
