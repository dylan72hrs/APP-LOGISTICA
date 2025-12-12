'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfile, UserRole } from '@/lib/types';
import { mockUsers } from '@/lib/data';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // In a real app, you'd have a listener to Firebase Auth state changes.
    // For this mockup, we check localStorage.
    const userRole = localStorage.getItem('user_role') as UserRole | null;
    const userEmail = localStorage.getItem('user_email');
    
    if (userEmail) {
      // Find user from mock data. In real app, fetch from Firestore.
      const foundUser = mockUsers.find(u => u.email === userEmail) || {
        uid: 'mock-uid',
        email: userEmail,
        name: userEmail.split('@')[0],
        role: userRole || 'unassigned',
        ...(userRole === 'operator' && { warehouseId: 'stgo-1' })
      };
      setUser(foundUser);
    } else {
        if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
            router.push('/login');
        }
    }
    setLoading(false);
  }, [router, pathname]);

  const logout = () => {
    // In a real app, this would sign out from Firebase.
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    setUser(null);
    router.push('/login');
  };

  const value = { user, loading, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
