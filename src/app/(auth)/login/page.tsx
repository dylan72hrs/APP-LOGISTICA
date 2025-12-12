'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

// In a real app, this would use an Auth Context or hook
// For this mockup, we'll simulate login by storing in localStorage
const fakeLogin = (email: string) => {
  if (typeof window !== 'undefined') {
    let userRole = 'operator';
    if (email.toLowerCase().includes('admin')) {
      userRole = 'admin';
    } else if (email.toLowerCase().includes('reportes')) {
      userRole = 'reports';
    }
    localStorage.setItem('user_role', userRole);
    localStorage.setItem('user_email', email);
  }
};

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      fakeLogin(email);
      router.push('/dashboard');
      router.refresh(); // Forces a refresh to re-evaluate auth state
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, ingresa tu correo y contraseña.",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Package className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold">StockFlow</CardTitle>
          <CardDescription>Inicia sesión para gestionar tu inventario</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@stockflow.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <div className="text-center text-sm">
                ¿No tienes una cuenta?{' '}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                Regístrate
                </Link>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
