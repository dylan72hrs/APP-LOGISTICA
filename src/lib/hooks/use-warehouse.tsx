'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { useData } from './use-data';
import type { Warehouse } from '../types';

interface WarehouseContextType {
  selectedWarehouseId: string;
  setSelectedWarehouseId: (warehouseId: string) => void;
  availableWarehouses: Warehouse[];
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);
const SELECTED_WAREHOUSE_STORAGE_KEY = 'app-logistica:selected-warehouse:v1';

function loadStoredWarehouseId() {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(SELECTED_WAREHOUSE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveStoredWarehouseId(warehouseId: string) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SELECTED_WAREHOUSE_STORAGE_KEY, warehouseId);
  } catch {
    // Visual context persistence should not break warehouse selection.
  }
}

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { warehouses } = useData();
  
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [availableWarehouses, setAvailableWarehouses] = useState<Warehouse[]>(warehouses);

  useEffect(() => {
    if (!user) return;

    if (user.role === 'operator' && user.warehouseId) {
      setSelectedWarehouseId(user.warehouseId);
      setAvailableWarehouses(warehouses.filter(w => w.id === user.warehouseId));
    } else if (user.role === 'reports' && user.country) {
      const countryWarehouses = warehouses.filter(w => w.country === user.country);
      setAvailableWarehouses(countryWarehouses);
      const storedWarehouseId = loadStoredWarehouseId();
      const canUseStoredWarehouse = storedWarehouseId === 'all' || countryWarehouses.some(w => w.id === storedWarehouseId);
      setSelectedWarehouseId(canUseStoredWarehouse ? storedWarehouseId! : 'all');
    } else if (user.role === 'admin') {
      setAvailableWarehouses(warehouses);
      const storedWarehouseId = loadStoredWarehouseId();
      const canUseStoredWarehouse = storedWarehouseId === 'all' || warehouses.some(w => w.id === storedWarehouseId);
      setSelectedWarehouseId(canUseStoredWarehouse ? storedWarehouseId! : 'all');
    }
  }, [user, warehouses]);
  

  const setWarehouseId = (id: string) => {
    if (user?.role === 'operator') {
      return; // Operators cannot change their assigned warehouse
    }
    setSelectedWarehouseId(id);
    saveStoredWarehouseId(id);
  };

  const value = { 
    selectedWarehouseId,
    setSelectedWarehouseId: setWarehouseId,
    availableWarehouses,
  };

  return <WarehouseContext.Provider value={value}>{children}</WarehouseContext.Provider>;
}

export function useWarehouse() {
  const context = useContext(WarehouseContext);
  if (context === undefined) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
}
