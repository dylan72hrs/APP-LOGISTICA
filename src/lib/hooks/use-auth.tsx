'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { UserProfile, UserRole } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { useData } from './use-data';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { users } = useData();

  const validateUser = useCallback((email: string) => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      setUser(foundUser);
      return foundUser;
    } else {
      const tempUser: UserProfile = {
        uid: `temp-${Date.now()}`,
        email: email,
        name: email.split('@')[0],
        role: 'unassigned',
      };
      setUser(tempUser);
      return tempUser;
    }
  }, [users]);

  useEffect(() => {
    // Esperar a que los datos de usuarios estén cargados
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
      validateUser(userEmail);
    } else {
      if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
        router.push('/login');
      }
    }
    
    setLoading(false);
  }, [pathname, users, validateUser, router]);

  const login = (email: string) => {
    localStorage.setItem('user_email', email);
    // Determinamos el rol para el simulacro de login
    let userRole: UserRole = 'operator';
    if (email.toLowerCase().includes('admin')) userRole = 'admin';
    else if (email.toLowerCase().includes('mzarate')) userRole = 'reports';
    else if (email.toLowerCase().includes('imaulen')) userRole = 'admin';
    
    localStorage.setItem('user_role', userRole);
    
    // Actualizamos el estado inmediatamente para evitar la redirección
    const loggedUser = validateUser(email);
    setLoading(false);
    
    router.push('/dashboard');
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
