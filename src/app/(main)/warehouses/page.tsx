'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockWarehouses as initialWarehouses } from '@/lib/data';
import type { Warehouse } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export default function WarehousesPage() {
    const { toast } = useToast();
    const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

    const handleSaveWarehouse = (formData: FormData) => {
        const warehouse: Warehouse = {
            id: editingWarehouse?.id || `wh-${Date.now()}`,
            name: formData.get('name') as string,
            city: formData.get('city') as string,
            country: formData.get('country') as string,
        };

        if (!warehouse.name || !warehouse.city || !warehouse.country) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Por favor, completa todos los campos.'
            });
            return;
        }

        if (editingWarehouse) {
            setWarehouses(warehouses.map(w => w.id === editingWarehouse.id ? warehouse : w));
             toast({ title: "Bodega actualizada", description: "La bodega ha sido actualizada correctamente." });
        } else {
            setWarehouses([warehouse, ...warehouses]);
             toast({ title: "Bodega creada", description: "La nueva bodega ha sido creada." });
        }
        
        setIsDialogOpen(false);
        setEditingWarehouse(null);
    };

    const handleEditClick = (warehouse: Warehouse) => {
        setEditingWarehouse(warehouse);
        setIsDialogOpen(true);
    }
    
    const handleAddNewClick = () => {
        setEditingWarehouse(null);
        setIsDialogOpen(true);
    }

    const handleDeleteWarehouse = (id: string) => {
        setWarehouses(warehouses.filter(w => w.id !== id));
        toast({
          variant: "destructive",
          title: "Bodega eliminada",
          description: "La bodega ha sido eliminada."
      });
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Gestión de Bodegas</h1>
                <Button onClick={handleAddNewClick}>
                    <PlusCircle className="mr-2" />
                    Crear Bodega
                </Button>
            </div>
             <CardDescription>Crea, edita y administra las bodegas en diferentes países.</CardDescription>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre Bodega</TableHead>
                                <TableHead>Ciudad</TableHead>
                                <TableHead>País</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {warehouses.map((warehouse) => (
                                <TableRow key={warehouse.id}>
                                    <TableCell className="font-medium">{warehouse.name}</TableCell>
                                    <TableCell>{warehouse.city}</TableCell>
                                    <TableCell>{warehouse.country}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleEditClick(warehouse)}>
                                                    <Pencil className="mr-2 h-4 w-4"/>
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteWarehouse(warehouse.id)} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4"/>
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setEditingWarehouse(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingWarehouse ? 'Editar Bodega' : 'Crear Nueva Bodega'}</DialogTitle>
                    </DialogHeader>
                    <WarehouseForm warehouse={editingWarehouse} onSave={handleSaveWarehouse} />
                </DialogContent>
            </Dialog>
        </div>
    );
}

function WarehouseForm({ warehouse, onSave }: { warehouse: Warehouse | null, onSave: (data: FormData) => void }) {
    return (
        <form action={onSave} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nombre de Bodega</Label>
                <Input id="name" name="name" defaultValue={warehouse?.name} placeholder="Ej: ANTF-01" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" name="city" type="text" defaultValue={warehouse?.city} placeholder="Ej: Antofagasta" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input id="country" name="country" type="text" defaultValue={warehouse?.country} placeholder="Ej: Chile" required />
            </div>
            
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Guardar</Button>
            </DialogFooter>
        </form>
    );
}
