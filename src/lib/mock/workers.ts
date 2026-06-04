import type { Worker } from '@/lib/types';

// Demo/mock workers for the in-memory prototype. Not production data.
export const mockWorkers: Worker[] = [
  { id: '12345678-9', rut: '12.345.678-9', name: 'Carlos Soto', position: 'Operador de Maquinaria', department: 'Operaciones Mina', warehouseId: 'stgo-1' },
  { id: '98765432-1', rut: '9.876.543-2', name: 'Luisa Martinez', position: 'Geóloga', department: 'Geología', warehouseId: 'stgo-1' },
];
