import type { ConsumptionRecord } from '@/lib/types';
import type { DataRepository, PersistedDataSnapshot } from './data-repository';
import type { MockDataSnapshot } from './mock-repository';
import { LOCAL_STORAGE_KEYS } from './storage-keys';

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function isPersistedDataSnapshot(value: unknown): value is PersistedDataSnapshot {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<Record<keyof PersistedDataSnapshot, unknown>>;
  return (
    Array.isArray(candidate.warehouses) &&
    Array.isArray(candidate.inventory) &&
    Array.isArray(candidate.projects) &&
    Array.isArray(candidate.workers) &&
    Array.isArray(candidate.consumptionRecords)
  );
}

function hydrateConsumptionRecords(records: ConsumptionRecord[]): ConsumptionRecord[] | null {
  const hydrated = records.map((record) => {
    const date = new Date(record.date);
    if (Number.isNaN(date.getTime())) return null;

    return {
      ...record,
      date,
    };
  });

  if (hydrated.some((record) => record === null)) {
    return null;
  }

  return hydrated as ConsumptionRecord[];
}

export const localStorageRepository: DataRepository = {
  load(seed: MockDataSnapshot): MockDataSnapshot {
    if (!canUseLocalStorage()) return seed;

    try {
      const storedValue = window.localStorage.getItem(LOCAL_STORAGE_KEYS.pilotData);
      if (!storedValue) return seed;

      const parsedValue = JSON.parse(storedValue);
      if (!isPersistedDataSnapshot(parsedValue)) return seed;

      const consumptionRecords = hydrateConsumptionRecords(parsedValue.consumptionRecords);
      if (!consumptionRecords) return seed;

      return {
        ...seed,
        warehouses: parsedValue.warehouses,
        inventory: parsedValue.inventory,
        projects: parsedValue.projects,
        workers: parsedValue.workers,
        consumptionRecords,
      };
    } catch {
      return seed;
    }
  },

  save(snapshot: PersistedDataSnapshot) {
    if (!canUseLocalStorage()) return;

    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.pilotData, JSON.stringify(snapshot));
    } catch {
      // Pilot persistence must never break the app if browser storage is unavailable.
    }
  },
};
