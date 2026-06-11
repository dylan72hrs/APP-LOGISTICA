import type { ConsumptionRecord } from '@/lib/types';

// Demo/mock consumption records for the in-memory prototype. Not production data.
// ETAPA 4.7K: incluyen projectId + snapshot minimo del proyecto.
export const mockConsumptionRecords: ConsumptionRecord[] = [
  {
    id: 'cons-1',
    date: new Date('2024-07-20'),
    workerId: '12345678-9',
    projectId: 'CL01',
    projectCode: 'CL01',
    projectName: 'División Diamante - El Teniente',
    costCenter: 'CC-1001',
    financialDimension: 'FD-MIN-ELTE',
    items: [{ itemId: 'EPP001', quantity: 1 }, { itemId: 'EPP002', quantity: 2 }],
    warehouseId: 'stgo-1',
  },
  {
    id: 'cons-2',
    date: new Date('2024-07-21'),
    workerId: '98765432-1',
    projectId: 'CL01',
    projectCode: 'CL01',
    projectName: 'División Diamante - El Teniente',
    costCenter: 'CC-1001',
    financialDimension: 'FD-MIN-ELTE',
    items: [{ itemId: 'EPP003', quantity: 1 }],
    warehouseId: 'stgo-1',
  },
  {
    id: 'cons-3',
    date: new Date('2024-07-22'),
    workerId: '12345678-9',
    projectId: 'CL02',
    projectCode: 'CL02',
    projectName: 'Operación Rancagua',
    costCenter: 'CC-2002',
    financialDimension: 'FD-OPS-RGUA',
    items: [{ itemId: 'EPP004', quantity: 1 }],
    warehouseId: 'stgo-1',
  },
];
