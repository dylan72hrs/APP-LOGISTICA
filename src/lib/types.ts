export type UserRole = 'admin' | 'operator' | 'reports' | 'unassigned';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  warehouseId?: string; // For operators
  country?: string; // For reports role
}

export interface Warehouse {
  id: string;
  name:string;
  city: string;
  country: string;
}

export interface InventoryItem {
  id: string; // Will be the same as 'code'
  code: string;
  description: string;
  size: string;
  quantity: number;
  cost: number;
  warehouseId: string;
}

export type ProjectStatus = 'active' | 'inactive';

export interface Project {
  id: string; // Same as projectCode for locally created projects (e.g. CL01).
  projectCode: string;
  name: string;
  financialDimension: string;
  costCenter: string;
  manager: string;
  approver: string;
  status: ProjectStatus;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Worker {
  id: string; // Can be the RUT
  rut: string;
  name: string;
  position: string;
  department: string;
  warehouseId: string;
}

export interface ConsumptionRecord {
  id: string;
  date: Date;
  workerId: string;
  // ETAPA 4.7K: projectId es el dato operativo real del proyecto y es obligatorio
  // para registrar consumos nuevos (la UI lo exige). Se mantiene opcional en el tipo
  // solo por compatibilidad con registros historicos previos a esta etapa.
  projectId?: string;
  projectCode?: string; // snapshot al momento del consumo
  projectName?: string; // snapshot al momento del consumo
  costCenter?: string; // snapshot al momento del consumo
  financialDimension?: string; // snapshot al momento del consumo
  // requesterReference es una referencia libre opcional; NO reemplaza al proyecto.
  requesterReference?: string;
  items: {
    itemId: string;
    quantity: number;
  }[];
  warehouseId: string;
}
