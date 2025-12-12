'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockUsers as initialUsers, mockWarehouses } from '@/lib/data';
import type { UserProfile, UserRole, Warehouse } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const roleNames: Record<UserRole, string> = {
    admin: 'Administrador',
    operator: 'Operador',
    reports: 'Reportes',
    unassigned: 'Sin Asignar'
};

export default function AdminUsersPage() {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserProfile[]>(initialUsers);
    const [warehouses] = useState<Warehouse[]>(mockWarehouses);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

    const handleSaveUser = (formData: FormData) => {
        const user: UserProfile = {
            uid: editingUser?.uid || `user-${Date.now()}`,
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            role: formData.get('role') as UserRole,
            warehouseId: formData.get('role') === 'operator' ? formData.get('warehouseId') as string : undefined,
        };

        if (!user.name || !user.email || !user.role) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Por favor, completa todos los campos requeridos.'
            });
            return;
        }
        
        if (user.role === 'operator' && !user.warehouseId) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Los operadores deben tener una bodega asignada.'
            });
            return;
        }

        if (editingUser) {
            setUsers(users.map(u => u.uid === editingUser.uid ? user : u));
             toast({ title: "Usuario actualizado", description: "El usuario ha sido actualizado correctamente." });
        } else {
            setUsers([user, ...users]);
             toast({ title: "Usuario creado", description: "El nuevo usuario ha sido creado." });
        }
        
        setIsDialogOpen(false);
        setEditingUser(null);
    };

    const handleEditClick = (user: UserProfile) => {
        setEditingUser(user);
        setIsDialogOpen(true);
    }
    
    const handleAddNewClick = () => {
        setEditingUser(null);
        setIsDialogOpen(true);
    }

    const handleDeleteUser = (uid: string) => {
        setUsers(users.filter(u => u.uid !== uid));
        toast({
          variant: "destructive",
          title: "Usuario eliminado",
          description: "El usuario ha sido eliminado."
      });
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Administración de Usuarios</h1>
                <Button onClick={handleAddNewClick}>
                    <PlusCircle className="mr-2" />
                    Crear Usuario
                </Button>
            </div>
             <CardDescription>Crea nuevos usuarios y gestiona sus roles y permisos.</CardDescription>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Bodega Asignada</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => {
                                const assignedWarehouse = warehouses.find(w => w.id === user.warehouseId);
                                return (
                                    <TableRow key={user.uid}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{roleNames[user.role]}</TableCell>
                                        <TableCell>{assignedWarehouse ? `${assignedWarehouse.name} (${assignedWarehouse.country})` : 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                                        <Pencil className="mr-2 h-4 w-4"/>
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteUser(user.uid)} className="text-destructive focus:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4"/>
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setEditingUser(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</DialogTitle>
                    </DialogHeader>
                    <UserForm user={editingUser} warehouses={warehouses} onSave={handleSaveUser} />
                </DialogContent>
            </Dialog>
        </div>
    );
}

function UserForm({ user, warehouses, onSave }: { user: UserProfile | null, warehouses: Warehouse[], onSave: (data: FormData) => void }) {
    const [selectedRole, setSelectedRole] = useState<UserRole | undefined>(user?.role);

    return (
        <form action={onSave} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input id="name" name="name" defaultValue={user?.name} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" name="email" type="email" defaultValue={user?.email} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select name="role" defaultValue={user?.role} onValueChange={(value) => setSelectedRole(value as UserRole)} required>
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="operator">Operador</SelectItem>
                        <SelectItem value="reports">Reportes</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {(selectedRole === 'operator') && (
                <div className="space-y-2">
                    <Label htmlFor="warehouseId">Bodega Asignada</Label>
                    <Select name="warehouseId" defaultValue={user?.warehouseId}>
                        <SelectTrigger id="warehouseId">
                            <SelectValue placeholder="Selecciona una bodega" />
                        </SelectTrigger>
                        <SelectContent>
                            {warehouses.map(w => (
                                <SelectItem key={w.id} value={w.id}>{`${w.name} (${w.country})`}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Guardar</Button>
            </DialogFooter>
        </form>
    );
}
