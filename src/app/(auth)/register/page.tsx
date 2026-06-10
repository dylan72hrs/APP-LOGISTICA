'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <UserPlus className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold">Registro deshabilitado</CardTitle>
          <CardDescription>
            Registro deshabilitado para MVP. Los usuarios reales requieren backend y autenticacion real.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Esta version mantiene un unico acceso demo local para pruebas controladas.
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/login">Volver al login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
