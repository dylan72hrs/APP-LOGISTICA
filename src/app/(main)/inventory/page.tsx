'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockInventory as initialInventory } from '@/lib/data';
import type { InventoryItem } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/hooks/use-auth';
import { Badge } from '@/components/ui/badge';

export default function InventoryPage() {
    const { toast } = useToast();
    const { user } = useAuth();

    // Filter inventory based on user's role and warehouse
    const getVisibleInventory = () => {
        if (!user) return [];
        if (user.role === 'admin') {
            // Admins see all inventory, but we should probably show which warehouse it is
            return initialInventory;
        }
        if (user.role === 'operator' && user.warehouseId) {
            return initialInventory.filter(item => item.warehouseId === user.warehouseId);
        }
        return [];
    }

    const [inventory, setInventory] = useState<InventoryItem[]>(getVisibleInventory());
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    

    const handleSaveItem = (formData: FormData) => {
        const item: Omit<InventoryItem, 'id' | 'warehouseId'> & { id?: string, warehouseId?: string } = {
            code: formData.get('code') as string,
            description: formData.get('description') as string,
            size: formData.get('size') as string,
            quantity: parseInt(formData.get('quantity') as string, 10),
            cost: parseFloat(formData.get('cost') as string),
        };

        if (!item.code || !item.description || !item.size || isNaN(item.quantity) || isNaN(item.cost)) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Por favor, completa todos los campos correctamente.'
            });
            return;
        }

        const finalItem: InventoryItem = {
            ...item,
            id: editingItem?.id || item.code,
            warehouseId: editingItem?.warehouseId || (user?.role === 'operator' ? user.warehouseId! : 'stgo-1') // Default for admin for now
        };

        if (editingItem) {
            setInventory(inventory.map(i => i.id === editingItem.id ? finalItem : i));
            toast({ title: "Producto actualizado", description: "El item del inventario ha sido actualizado." });
        } else {
             // Check if item code already exists
            if (inventory.some(i => i.code.toLowerCase() === finalItem.code.toLowerCase())) {
                toast({
                    variant: 'destructive',
                    title: 'Error de Código',
                    description: `El código de producto '${finalItem.code}' ya existe.`
                });
                return;
            }
            setInventory([finalItem, ...inventory]);
            toast({ title: "Producto creado", description: "El nuevo item ha sido agregado al inventario." });
        }
        
        setIsDialogOpen(false);
        setEditingItem(null);
    };

    const handleEditClick = (item: InventoryItem) => {
        setEditingItem(item);
        setIsDialogOpen(true);
    }
    
    const handleAddNewClick = () => {
        if (user?.role === 'operator' && !user.warehouseId) {
             toast({
                variant: 'destructive',
                title: 'No tienes bodega asignada',
                description: 'No puedes agregar productos sin una bodega.'
            });
            return;
        }
        setEditingItem(null);
        setIsDialogOpen(true);
    }

    const handleDeleteItem = (id: string, warehouseId: string) => {
        setInventory(inventory.filter(i => !(i.id === id && i.warehouseId === warehouseId)));
        toast({
          variant: "destructive",
          title: "Producto eliminado",
          description: "El item del inventario ha sido eliminado."
      });
    }
    
    const getStockStatus = (quantity: number): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
        if (quantity <= 0) return { text: "Sin Stock", variant: "destructive" };
        if (quantity < 20) return { text: "Stock Bajo", variant: "secondary" };
        return { text: "En Stock", variant: "default" };
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Productos EPP</h1>
                <Button onClick={handleAddNewClick} disabled={user?.role === 'reports'}>
                    <PlusCircle className="mr-2" />
                    Ingresar Producto
                </Button>
            </div>
             <CardDescription>Gestiona el stock de Equipos de Protección Personal de tu bodega.</CardDescription>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Talla/U. Medida</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                                <TableHead className="text-right">Costo Unitario</TableHead>
                                <TableHead>Estado</TableHead>
                                {user?.role === 'admin' && <TableHead>Bodega</TableHead>}
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inventory.map((item) => {
                                const stockStatus = getStockStatus(item.quantity);
                                return (
                                    <TableRow key={`${item.id}-${item.warehouseId}`}>
                                        <TableCell className="font-medium">{item.code}</TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell>{item.size}</TableCell>
                                        <TableCell className="text-right">{item.quantity.toLocaleString('es-ES')}</TableCell>
                                        <TableCell className="text-right">${item.cost.toLocaleString('es-ES')}</TableCell>
                                        <TableCell>
                                            <Badge variant={stockStatus.variant}>{stockStatus.text}</Badge>
                                        </TableCell>
                                        {user?.role === 'admin' && <TableCell>{item.warehouseId}</TableCell>}
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleEditClick(item)}>
                                                        <Pencil className="mr-2 h-4 w-4"/>
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteItem(item.id, item.warehouseId)} className="text-destructive focus:text-destructive">
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
                if (!open) setEditingItem(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Editar Producto' : 'Ingresar Nuevo Producto'}</DialogTitle>
                    </DialogHeader>
                    <ItemForm item={editingItem} onSave={handleSaveItem} />
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ItemForm({ item, onSave }: { item: InventoryItem | null, onSave: (data: FormData) => void }) {
    return (
        <form action={onSave} className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="code">Código</Label>
                <Input id="code" name="code" defaultValue={item?.code} required disabled={!!item} />
            </div>
             <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="size">Talla / U. Medida</Label>
                <Input id="size" name="size" defaultValue={item?.size} required />
            </div>
            <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Input id="description" name="description" defaultValue={item?.description} required />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="quantity">Cantidad de Ingreso</Label>
                <Input id="quantity" name="quantity" type="number" defaultValue={item?.quantity} required min="0"/>
            </div>
             <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="cost">Precio (Costo Unitario)</Label>
                <Input id="cost" name="cost" type="number" step="0.01" defaultValue={item?.cost} required min="0"/>
            </div>
            
            <DialogFooter className="col-span-2">
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Guardar</Button>
            </DialogFooter>
        </form>
    );
}
