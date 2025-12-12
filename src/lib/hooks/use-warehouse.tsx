'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './use-auth';

interface WarehouseContextType {
  selectedWarehouseId: string;
  setSelectedWarehouseId: (warehouseId: string) => void;
  userWarehouseId?: string; // The specific warehouse assigned to an operator
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Admin starts with 'all', operator starts with their assigned warehouse
  const initialWarehouse = user?.role === 'operator' ? user.warehouseId || '' : 'all';
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(initialWarehouse);

  useEffect(() => {
    // If the user role changes or logs in/out, reset the warehouse selection
    if (user) {
        const newInitialWarehouse = user.role === 'operator' ? user.warehouseId || '' : 'all';
        setSelectedWarehouseId(newInitialWarehouse);
    }
  }, [user]);

  const value = { 
    selectedWarehouseId, 
    setSelectedWarehouseId,
    userWarehouseId: user?.warehouseId
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
