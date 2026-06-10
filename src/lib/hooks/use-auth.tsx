'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { UserProfile } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { useData } from './use-data';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERNAME = 'admin';
const DEMO_PASSWORD = 'admin';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { users } = useData();

  const validateUser = useCallback((username: string) => {
    const normalizedUsername = username.trim().toLowerCase();
    const foundUser = users.find(u => u.email.toLowerCase() === normalizedUsername);

    if (foundUser) {
      setUser(foundUser);
      return foundUser;
    }

    setUser(null);
    return null;
  }, [users]);

  useEffect(() => {
    // Esperar a que los datos de usuarios esten cargados.
    if (users.length === 0) {
      if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
        setLoading(false);
      } else {
        setLoading(true);
      }
      return;
    }

    const userEmail = localStorage.getItem('user_email');

    if (userEmail) {
      const restoredUser = validateUser(userEmail);
      if (!restoredUser) {
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_email');
        if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
          router.push('/login');
        }
      }
    } else if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
      router.push('/login');
    }

    setLoading(false);
  }, [pathname, users, validateUser, router]);

  const login = (username: string, password: string) => {
    const normalizedUsername = username.trim().toLowerCase();
    const isDemoAdmin = normalizedUsername === DEMO_USERNAME && password === DEMO_PASSWORD;

    if (!isDemoAdmin) {
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_email');
      setUser(null);
      return false;
    }

    localStorage.setItem('user_email', DEMO_USERNAME);
    localStorage.setItem('user_role', 'admin');

    // Actualizamos el estado inmediatamente para evitar la redireccion.
    validateUser(DEMO_USERNAME);
    setLoading(false);

    router.push('/dashboard');
    return true;
  };

  const logout = () => {
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    setUser(null);
    router.push('/login');
  };

  const value = { user, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
