'use client';
import { AuthProvider } from '@/lib/hooks/use-auth';
import { DataProvider } from '@/lib/hooks/use-data';
import { LanguageProvider } from '@/lib/hooks/use-language';
import { WarehouseProvider } from '@/lib/hooks/use-warehouse';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <DataProvider>
        <AuthProvider>
          <WarehouseProvider>
            {children}
          </WarehouseProvider>
        </AuthProvider>
      </DataProvider>
    </LanguageProvider>
  );
}

    