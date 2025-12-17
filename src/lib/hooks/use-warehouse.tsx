'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './use-auth';

interface WarehouseContextType {
  selectedWarehouseId: string | null;
  setSelectedWarehouseId: (warehouseId: string) => void;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const getInitialWarehouse = () => {
    if (user?.role === 'operator' && user.warehouseId) {
      return user.warehouseId;
    }
    // Admin and other roles can start with 'all'
    return 'all';
  };
  
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(getInitialWarehouse());

  useEffect(() => {
    // This effect ensures that when the user logs in or changes,
    // the warehouse selection is correctly initialized.
    setSelectedWarehouseId(getInitialWarehouse());
  }, [user]);

  // This ensures the setter function respects the operator's role
  const setWarehouseId = (id: string) => {
    if (user?.role === 'operator') {
      // Operator cannot change their warehouse. It's fixed.
      setSelectedWarehouseId(user.warehouseId || null);
    } else {
      setSelectedWarehouseId(id);
    }
  };

  const value = { 
    selectedWarehouseId: user?.role === 'operator' ? user.warehouseId || null : selectedWarehouseId,
    setSelectedWarehouseId: setWarehouseId,
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
