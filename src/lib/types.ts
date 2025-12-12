export type UserRole = 'admin' | 'operator' | 'reports' | 'unassigned';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  warehouseId?: string; // For operators
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
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
  name: string;
}

export interface Worker {
  id: string; // Can be the RUT
  rut: string;
  name: string;
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
