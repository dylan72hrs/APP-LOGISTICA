import type { InventoryItem } from '@/lib/types';

// Demo/mock inventory products for the in-memory prototype. Not production data.
export const mockInventory: InventoryItem[] = [
  { id: 'EPP001', code: 'EPP001', description: 'Casco de seguridad', size: 'M', quantity: 18, cost: 25, warehouseId: 'stgo-1' },
  { id: 'EPP002', code: 'EPP002', description: 'Guantes de nitrilo', size: 'L', quantity: 12, cost: 15, warehouseId: 'stgo-1' },
  { id: 'EPP003', code: 'EPP003', description: 'Lentes de protecciÃ³n', size: 'N/A', quantity: 80, cost: 10, warehouseId: 'stgo-1' },
  { id: 'EPP004', code: 'EPP004', description: 'Botas de seguridad', size: '42', quantity: 30, cost: 60, warehouseId: 'stgo-1' },
  { id: 'EPP001', code: 'EPP001', description: 'Casco de seguridad', size: 'M', quantity: 25, cost: 25, warehouseId: 'valpo-1' },
  { id: 'EPP002', code: 'EPP002', description: 'Guantes de nitrilo', size: 'L', quantity: 80, cost: 15, warehouseId: 'valpo-1' },
];
