'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './use-auth';

interface WarehouseContextType {
  selectedWarehouseId: string;
  setSelectedWarehouseId: (warehouseId: string) => void;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Admin starts with 'all', operator starts with their assigned warehouse
  const getInitialWarehouse = () => {
    if (user?.role === 'operator' && user.warehouseId) {
      return user.warehouseId;
    }
    return 'all';
  };
  
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(getInitialWarehouse());

  useEffect(() => {
    // If the user logs in/out or their role changes, reset the warehouse selection.
    // This runs when `user` object changes.
    setSelectedWarehouseId(getInitialWarehouse());
  }, [user]);

  const value = { 
    selectedWarehouseId, 
    setSelectedWarehouseId,
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

    