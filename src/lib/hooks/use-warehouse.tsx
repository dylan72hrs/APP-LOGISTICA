'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { useData } from './use-data';

interface WarehouseContextType {
  selectedWarehouseId: string | null;
  setSelectedWarehouseId: (warehouseId: string) => void;
  availableWarehouses: { id: string; name: string }[];
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { warehouses } = useData();
  
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [availableWarehouses, setAvailableWarehouses] = useState(warehouses);

  useEffect(() => {
    if (user?.role === 'operator' && user.warehouseId) {
      setSelectedWarehouseId(user.warehouseId);
      setAvailableWarehouses(warehouses.filter(w => w.id === user.warehouseId));
    } else if (user?.role === 'reports' && user.country) {
      const countryWarehouses = warehouses.filter(w => w.country === user.country);
      setAvailableWarehouses(countryWarehouses);
      // Default to 'all' (which means all for their country)
      setSelectedWarehouseId('all'); 
    } else if (user?.role === 'admin') {
      setAvailableWarehouses(warehouses);
      setSelectedWarehouseId('all');
    }
  }, [user, warehouses]);
  

  const setWarehouseId = (id: string) => {
    if (user?.role === 'operator') {
      return;
    }
    setSelectedWarehouseId(id);
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
