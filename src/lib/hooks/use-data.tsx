'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { createMockDataSnapshot } from '@/lib/data/mock-repository';
import type { ConsumptionRecord, InventoryItem, Project, UserProfile, Warehouse, Worker } from '@/lib/types';

interface DataContextType {
  users: UserProfile[];
  warehouses: Warehouse[];
  inventory: InventoryItem[];
  projects: Project[];
  workers: Worker[];
  consumptionRecords: ConsumptionRecord[];
  
  // User functions
  addUser: (user: UserProfile) => void;
  updateUser: (user: UserProfile) => void;
  deleteUser: (uid: string) => void;

  // Warehouse functions
  addWarehouse: (warehouse: Warehouse) => void;
  updateWarehouse: (warehouse: Warehouse) => void;
  deleteWarehouse: (id: string) => void;

  // Inventory functions
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  updateInventoryItemQuantity: (itemId: string, warehouseId: string, newQuantity: number) => void;
  deleteInventoryItem: (id: string, warehouseId: string) => void;

  // Project functions
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;

  // Worker functions
  addWorker: (worker: Worker) => void;
  updateWorker: (worker: Worker) => void;
  deleteWorker: (id: string) => void;

  // Consumption functions
  addConsumptionRecord: (record: ConsumptionRecord) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [demoData] = useState(createMockDataSnapshot);
  const [users, setUsers] = useState<UserProfile[]>(demoData.users);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(demoData.warehouses);
  const [inventory, setInventory] = useState<InventoryItem[]>(demoData.inventory);
  const [projects, setProjects] = useState<Project[]>(demoData.projects);
  const [workers, setWorkers] = useState<Worker[]>(demoData.workers);
  const [consumptionRecords, setConsumptionRecords] = useState<ConsumptionRecord[]>(demoData.consumptionRecords);

  const value = {
    users,
    warehouses,
    inventory,
    projects,
    workers,
    consumptionRecords,
    addUser: (user: UserProfile) => setUsers(prev => [user, ...prev]),
    updateUser: (user: UserProfile) => setUsers(prev => prev.map(u => u.uid === user.uid ? user : u)),
    deleteUser: (uid: string) => setUsers(prev => prev.filter(u => u.uid !== uid)),
    
    addWarehouse: (warehouse: Warehouse) => setWarehouses(prev => [warehouse, ...prev]),
    updateWarehouse: (warehouse: Warehouse) => setWarehouses(prev => prev.map(w => w.id === warehouse.id ? warehouse : w)),
    deleteWarehouse: (id: string) => setWarehouses(prev => prev.filter(w => w.id !== id)),

    addInventoryItem: (item: InventoryItem) => setInventory(prev => [item, ...prev]),
    updateInventoryItem: (item: InventoryItem) => setInventory(prev => prev.map(i => i.id === item.id && i.warehouseId === item.warehouseId ? item : i)),
    updateInventoryItemQuantity: (itemId: string, warehouseId: string, newQuantity: number) => {
        setInventory(prev => prev.map(i => i.id === itemId && i.warehouseId === warehouseId ? {...i, quantity: newQuantity} : i))
    },
    deleteInventoryItem: (id: string, warehouseId: string) => setInventory(prev => prev.filter(i => !(i.id === id && i.warehouseId === warehouseId))),

    addProject: (project: Project) => setProjects(prev => [project, ...prev]),
    updateProject: (project: Project) => setProjects(prev => prev.map(p => p.id === project.id ? project : p)),
    deleteProject: (id: string) => setProjects(prev => prev.filter(p => p.id !== id)),

    addWorker: (worker: Worker) => setWorkers(prev => [worker, ...prev]),
    updateWorker: (worker: Worker) => setWorkers(prev => prev.map(w => w.id === worker.id ? worker : w)),
    deleteWorker: (id: string) => setWorkers(prev => prev.filter(w => w.id !== id)),

    addConsumptionRecord: (record: ConsumptionRecord) => setConsumptionRecords(prev => [record, ...prev]),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

    
