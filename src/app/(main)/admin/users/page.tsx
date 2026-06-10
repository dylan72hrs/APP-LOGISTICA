'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administracion de usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Modulo fuera del alcance MVP actual. La ruta se conserva para una etapa futura.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 text-amber-700">
            <ShieldAlert className="h-5 w-5" />
            <CardTitle className="text-lg">Gestion de usuarios deshabilitada</CardTitle>
          </div>
          <CardDescription>
            Esta demo usa un unico acceso local y no implementa autenticacion, roles ni permisos reales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Usuario demo activo: admin</p>
          <p>
            No hay CRUD de usuarios habilitado en esta etapa y no se muestran contrasenas de prueba en esta pantalla.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
