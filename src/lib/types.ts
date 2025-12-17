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

export interface Project {
  id: string;
  financialDimension?: string;
  name: string;
  manager: string;
  approver: string;
}

export interface Worker {
  id: string; // Can be the RUT
  rut: string;
  name: string;
  position: string;
  department: string;
}

export interface ConsumptionRecord {
  id: string;
  date: Date;
  workerId: string;
  projectId: string;
  items: {
    itemId: string;
    quantity: number;
  }[];
  warehouseId: string;
}
