import type { MockDataSnapshot } from './mock-repository';

export type PersistedDataSnapshot = Pick<
  MockDataSnapshot,
  'warehouses' | 'inventory' | 'projects' | 'workers' | 'consumptionRecords'
>;

export interface DataRepository {
  load(seed: MockDataSnapshot): MockDataSnapshot;
  save(snapshot: PersistedDataSnapshot): void;
}
