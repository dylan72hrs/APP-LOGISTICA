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
  FileSignature,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { useLanguage } from '@/lib/hooks/use-language';

const navItems = [
  { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, roles: ['admin', 'operator', 'reports'] },
  { href: '/inventory', labelKey: 'epp_products', icon: Boxes, roles: ['admin', 'operator'] },
  { href: '/workers', labelKey: 'workers', icon: HardHat, roles: ['admin', 'operator'] },
  { href: '/projects', labelKey: 'projects', icon: Building, roles: ['admin', 'operator'] },
  { href: '/consumptions', labelKey: 'consumptions', icon: Truck, roles: ['admin', 'operator'] },
  { href: '/consumption-sheet', labelKey: 'consumption_sheet', icon: FileSignature, roles: ['admin', 'reports', 'operator'] },
  { href: '/reports', labelKey: 'reports', icon: FileText, roles: ['admin', 'reports', 'operator'] },
  { href: '/restock', labelKey: 'ai_restock', icon: BrainCircuit, roles: ['admin'] },
  { href: '/warehouses', labelKey: 'warehouses', icon: Warehouse, roles: ['admin'] },
  { href: '/admin/users', labelKey: 'admin', icon: Users, roles: ['admin'] },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLanguage();
  const companyLogo = PlaceHolderImages.find(p => p.id === 'company-logo');

  const filteredNavItems = navItems.filter(item => {
    if (!user) return false;
    // Special rule for reports user
    if (user.role === 'reports') {
        return item.labelKey === 'dashboard' || item.labelKey === 'reports' || item.labelKey === 'consumption_sheet';
    }
    return item.roles.includes(user.role);
  });

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
                data-ai-hint={companyLogo.imageHint}
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
                  <span>{t(item.labelKey)}</span>
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
