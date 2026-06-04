import type { ConsumptionRecord } from '@/lib/types';

// Demo/mock consumption records for the in-memory prototype. Not production data.
export const mockConsumptionRecords: ConsumptionRecord[] = [
  { id: 'cons-1', date: new Date('2024-07-20'), workerId: '12345678-9', projectId: 'PROY-001', items: [{ itemId: 'EPP001', quantity: 1 }, { itemId: 'EPP002', quantity: 2 }], warehouseId: 'stgo-1' },
  { id: 'cons-2', date: new Date('2024-07-21'), workerId: '98765432-1', projectId: 'PROY-001', items: [{ itemId: 'EPP003', quantity: 1 }], warehouseId: 'stgo-1' },
  { id: 'cons-3', date: new Date('2024-07-22'), workerId: '12345678-9', projectId: 'PROY-002', items: [{ itemId: 'EPP004', quantity: 1 }], warehouseId: 'stgo-1' },
];
