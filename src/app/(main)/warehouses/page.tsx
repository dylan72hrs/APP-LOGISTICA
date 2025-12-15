'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Warehouse } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/hooks/use-language';
import { useData } from '@/lib/hooks/use-data';

export default function WarehousesPage() {
    const { toast } = useToast();
    const { t } = useLanguage();
    const { warehouses, addWarehouse, updateWarehouse, deleteWarehouse } = useData();
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
                title: t('error'),
                description: t('please_fill_all_fields')
            });
            return;
        }

        if (editingWarehouse) {
            updateWarehouse(warehouse);
             toast({ title: t('warehouse_updated'), description: t('warehouse_updated_successfully') });
        } else {
            addWarehouse(warehouse);
             toast({ title: t('warehouse_created'), description: t('new_warehouse_created_successfully') });
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

    const handleDeleteClick = (id: string) => {
        deleteWarehouse(id);
        toast({
          variant: "destructive",
          title: t('warehouse_deleted'),
          description: t('warehouse_deleted_successfully')
      });
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{t('warehouse_management')}</h1>
                <Button onClick={handleAddNewClick}>
                    <PlusCircle className="mr-2" />
                    {t('create_warehouse')}
                </Button>
            </div>
             <CardDescription>{t('create_edit_manage_warehouses')}</CardDescription>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('warehouse_name')}</TableHead>
                                <TableHead>{t('city')}</TableHead>
                                <TableHead>{t('country')}</TableHead>
                                <TableHead className="text-right">{t('actions')}</TableHead>
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
                                                    {t('edit')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteClick(warehouse.id)} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4"/>
                                                    {t('delete')}
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
                        <DialogTitle>{editingWarehouse ? t('edit_warehouse') : t('create_new_warehouse')}</DialogTitle>
                    </DialogHeader>
                    <WarehouseForm warehouse={editingWarehouse} onSave={handleSaveWarehouse} />
                </DialogContent>
            </Dialog>
        </div>
    );
}

function WarehouseForm({ warehouse, onSave }: { warehouse: Warehouse | null, onSave: (data: FormData) => void }) {
    const { t } = useLanguage();
    return (
        <form action={onSave} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">{t('warehouse_name')}</Label>
                <Input id="name" name="name" defaultValue={warehouse?.name} placeholder="Ej: ANTF-01" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="city">{t('city')}</Label>
                <Input id="city" name="city" type="text" defaultValue={warehouse?.city} placeholder="Ej: Antofagasta" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="country">{t('country')}</Label>
                <Input id="country" name="country" type="text" defaultValue={warehouse?.country} placeholder="Ej: Chile" required />
            </div>
            
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">{t('cancel')}</Button>
                </DialogClose>
                <Button type="submit">{t('save')}</Button>
            </DialogFooter>
        </form>
    );
}

    