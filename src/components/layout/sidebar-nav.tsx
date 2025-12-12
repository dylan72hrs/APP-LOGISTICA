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
} from 'lucide-react';
import type { UserRole } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

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
  const companyLogo = PlaceHolderImages.find(p => p.id === 'company-logo');

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-3 p-2">
            {companyLogo && (
              <Image 
                src={companyLogo.imageUrl}
                alt={companyLogo.description}
                width={40}
                height={40}
                className='rounded-md'
              />
            )}
          <span className="text-xl font-bold text-primary">EPP Tracker 3.0</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {filteredNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname.startsWith(item.href) && (item.href === '/dashboard' ? pathname === item.href : true)}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter />
    </>
  );
}
