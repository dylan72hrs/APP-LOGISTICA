import {
  mockConsumptionRecords,
  mockInventory,
  mockProjects,
  mockUsers,
  mockWarehouses,
  mockWorkers,
} from '@/lib/mock';
import type { ConsumptionRecord, InventoryItem, Project, UserProfile, Warehouse, Worker } from '@/lib/types';

export interface MockDataSnapshot {
  users: UserProfile[];
  warehouses: Warehouse[];
  inventory: InventoryItem[];
  projects: Project[];
  workers: Worker[];
  consumptionRecords: ConsumptionRecord[];
}

// Demo repository boundary for ETAPA 2. Replace this in ETAPA 3 with a real persistence-backed repository.
export function createMockDataSnapshot(): MockDataSnapshot {
  return {
    users: [...mockUsers],
    warehouses: [...mockWarehouses],
    inventory: [...mockInventory],
    projects: [...mockProjects],
    workers: [...mockWorkers],
    consumptionRecords: [...mockConsumptionRecords],
  };
}
