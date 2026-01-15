'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfile } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { useData } from './use-data';

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
  const { users } = useData();

  useEffect(() => {
    // This is the key fix. We must wait until the user data is loaded
    // before trying to find the user. Otherwise, we get a race condition
    // where we check for a user against an empty list.
    if (users.length === 0) {
      // If there are no users, and we are not on a public page, we keep loading.
      // If we are already on a public page, we can stop loading.
      if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
        setLoading(true);
      } else {
        setLoading(false);
      }
      return;
    }

    const userEmail = localStorage.getItem('user_email');
    
    if (userEmail) {
      const foundUser = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
      
      if (foundUser) {
        setUser(foundUser);
      } else {
        // Handle case where email is in localStorage but user is not in our data
        // This could be a new, unassigned user.
        setUser({
          uid: `temp-${Date.now()}`,
          email: userEmail,
          name: userEmail.split('@')[0],
          role: 'unassigned',
        });
      }
    } else {
      if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
        router.push('/login');
      }
    }
    setLoading(false);
  }, [router, pathname, users]);

  const logout = () => {
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
