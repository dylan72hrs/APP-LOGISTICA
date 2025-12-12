'use client';
import { AuthProvider } from '@/lib/hooks/use-auth';
import { LanguageProvider } from '@/lib/hooks/use-language';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </LanguageProvider>
  );
}
