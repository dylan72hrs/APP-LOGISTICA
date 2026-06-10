'use client';
import React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/hooks/use-language';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user.role === 'unassigned') {
    return (
      <div className="flex h-screen items-center justify-center text-center p-4">
        <div>
          <h1 className="text-2xl font-bold">{t('account_pending_assignment')}</h1>
          <p className="text-muted-foreground">{t('account_created_no_role')}</p>
          <p className="text-muted-foreground">{t('contact_admin_to_activate')}</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar className="print:hidden">
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <div className="print:hidden">
          <Header />
        </div>
        <main className="p-4 print:p-0 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
