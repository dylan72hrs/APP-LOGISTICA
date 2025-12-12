import type { Warehouse, InventoryItem, UserProfile, Project, Worker, ConsumptionRecord } from './types';

export const mockUsers: UserProfile[] = [
  { uid: 'admin-user-1', email: 'Imaulen@masterdrilling.com', name: 'Admin General', role: 'admin' },
  { uid: 'operator-user-1', email: 'Jcornejo@masterdrilling.com', name: 'Juan Pérez', role: 'operator', warehouseId: 'stgo-1' },
  { uid: 'operator-user-2', email: 'operador.valpo@stockflow.com', name: 'Ana Gómez', role: 'operator', warehouseId: 'valpo-1' },
  { uid: 'reports-user-1', email: 'Mzarate@masterdrilling.com', name: 'María Rojas', role: 'reports' },
];

export const mockWarehouses: Warehouse[] = [
  { id: 'stgo-1', name: 'STGO-1', location: 'Santiago' },
  { id: 'valpo-1', name: 'VALPO-1', location: 'Valparaíso' },
];

export const mockInventory: InventoryItem[] = [
  { id: 'EPP001', code: 'EPP001', description: 'Casco de seguridad', size: 'M', quantity: 18, cost: 25, warehouseId: 'stgo-1' },
  { id: 'EPP002', code: 'EPP002', description: 'Guantes de nitrilo', size: 'L', quantity: 12, cost: 15, warehouseId: 'stgo-1' },
  { id: 'EPP003', code: 'EPP003', description: 'Lentes de protección', size: 'N/A', quantity: 80, cost: 10, warehouseId: 'stgo-1' },
  { id: 'EPP004', code: 'EPP004', description: 'Botas de seguridad', size: '42', quantity: 30, cost: 60, warehouseId: 'stgo-1' },
  { id: 'EPP001', code: 'EPP001', description: 'Casco de seguridad', size: 'M', quantity: 25, cost: 25, warehouseId: 'valpo-1' },
  { id: 'EPP002', code: 'EPP002', description: 'Guantes de nitrilo', size: 'L', quantity: 80, cost: 15, warehouseId: 'valpo-1' },
];

export const mockProjects: Project[] = [
    { id: 'PROY-001', name: 'Construcción Edificio Central' },
    { id: 'PROY-002', name: 'Mantenimiento Planta Norte' },
];

export const mockWorkers: Worker[] = [
    { id: '12345678-9', rut: '12.345.678-9', name: 'Carlos Soto' },
    { id: '98765432-1', rut: '9.876.543-2', name: 'Luisa Martinez' },
];

export const mockConsumptionRecords: ConsumptionRecord[] = [
    { id: 'cons-1', date: new Date('2024-07-20'), workerId: '12345678-9', projectId: 'PROY-001', items: [{ itemId: 'EPP001', quantity: 1 }, { itemId: 'EPP002', quantity: 2 }], warehouseId: 'stgo-1'},
    { id: 'cons-2', date: new Date('2024-07-21'), workerId: '98765432-1', projectId: 'PROY-001', items: [{ itemId: 'EPP003', quantity: 1 }], warehouseId: 'stgo-1'},
    { id: 'cons-3', date: new Date('2024-07-22'), workerId: '12345678-9', projectId: 'PROY-002', items: [{ itemId: 'EPP004', quantity: 1 }], warehouseId: 'stgo-1'},
];
