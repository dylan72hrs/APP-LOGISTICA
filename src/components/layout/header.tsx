'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/layout/user-nav';
import { useAuth } from '@/lib/hooks/use-auth';
import { mockWarehouses } from '@/lib/data';
import { Warehouse, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/lib/hooks/use-language';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWarehouse } from '@/lib/hooks/use-warehouse';


export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
          <span className="sr-only">{t('change_language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => setLanguage('es')} disabled={language === 'es'}>
            Castellano
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setLanguage('en')} disabled={language === 'en'}>
            English
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setLanguage('fr')} disabled={language === 'fr'}>
            Français
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export function WarehouseSwitcher() {
    const { t } = useLanguage();
    const { selectedWarehouseId, setSelectedWarehouseId } = useWarehouse();

    return (
        <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
            <SelectTrigger className="w-full sm:w-[200px] hidden md:flex">
                <Warehouse className="mr-2" />
                <SelectValue placeholder={t('select_warehouse')} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">{t('all_warehouses')}</SelectItem>
                {mockWarehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}


export function Header() {
    const { user } = useAuth();
    
    const assignedWarehouse = user?.role === 'operator' 
        ? mockWarehouses.find(w => w.id === user.warehouseId) 
        : null;

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        {user?.role === 'admin' ? (
            <WarehouseSwitcher />
        ) : assignedWarehouse && (
            <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
                <Warehouse className="h-4 w-4" />
                <span>{assignedWarehouse.name}</span>
            </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <UserNav />
      </div>
    </header>
  );
}
