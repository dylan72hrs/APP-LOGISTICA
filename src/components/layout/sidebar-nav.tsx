'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  LayoutDashboard,
  Boxes,
  Warehouse,
  Users,
  HardHat,
  Building,
  FileText,
  Truck,
  BrainCircuit,
  Package,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'operator', 'reports'] },
  { href: '/inventory', label: 'Inventario EPP', icon: Boxes, roles: ['admin', 'operator'] },
  { href: '/consumptions', label: 'Consumos', icon: Truck, roles: ['admin', 'operator'] },
  { href: '/reports', label: 'Informes', icon: FileText, roles: ['admin', 'reports'] },
  { href: '/restock', label: 'Sugerencias IA', icon: BrainCircuit, roles: ['admin'] },
  { href: '/warehouses', label: 'Bodegas', icon: Warehouse, roles: ['admin'] },
  { href: '/workers', label: 'Trabajadores', icon: HardHat, roles: ['admin'] },
  { href: '/projects', label: 'Proyectos', icon: Building, roles: ['admin'] },
  { href: '/admin/users', label: 'Admin', icon: Users, roles: ['admin'] },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-3 p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Package className="h-6 w-6 text-primary-foreground" />
            </div>
          <span className="text-xl font-bold text-primary">EPP Tracker 3.0</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {filteredNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton asChild isActive={pathname.startsWith(item.href) && (item.href === '/dashboard' ? pathname === item.href : true)}>
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter />
    </>
  );
}
