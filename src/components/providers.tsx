'use client';
import { AuthProvider } from '@/lib/hooks/use-auth';
import { LanguageProvider } from '@/lib/hooks/use-language';
import { WarehouseProvider } from '@/lib/hooks/use-warehouse';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <WarehouseProvider>
          {children}
        </WarehouseProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
