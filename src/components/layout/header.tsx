'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/layout/user-nav';
import { useAuth } from '@/lib/hooks/use-auth';
import { mockWarehouses } from '@/lib/data';
import { Warehouse } from 'lucide-react';

export function Header() {
    const { user } = useAuth();
    
    const assignedWarehouse = user?.role === 'operator' 
        ? mockWarehouses.find(w => w.id === user.warehouseId) 
        : null;

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        {assignedWarehouse && (
            <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
                <Warehouse className="h-4 w-4" />
                <span>Bodega: <strong>{assignedWarehouse.name}</strong></span>
            </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <UserNav />
      </div>
    </header>
  );
}
