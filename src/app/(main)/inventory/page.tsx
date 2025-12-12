'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockInventory as initialInventory, mockWarehouses } from '@/lib/data';
import type { InventoryItem } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Warehouse as WarehouseIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/lib/hooks/use-language';

export default function InventoryPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const { t, language } = useLanguage();
    
    const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');

    const visibleInventory = useMemo(() => {
        if (!user) return [];
        if (user.role === 'admin') {
            if (selectedWarehouseId === 'all') {
                return inventory;
            }
            return inventory.filter(item => item.warehouseId === selectedWarehouseId);
        }
        if (user.role === 'operator' && user.warehouseId) {
            return inventory.filter(item => item.warehouseId === user.warehouseId);
        }
        return [];
    }, [user, inventory, selectedWarehouseId]);

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
                title: t('error'),
                description: t('please_fill_all_fields_correctly')
            });
            return;
        }
        
        let warehouseId = editingItem?.warehouseId;
        if (!warehouseId) {
            if (user?.role === 'operator') {
                warehouseId = user.warehouseId!;
            } else if (user?.role === 'admin') {
                // If admin is adding and has a warehouse selected, use it. Otherwise, default.
                warehouseId = selectedWarehouseId !== 'all' ? selectedWarehouseId : 'stgo-1';
            }
        }


        const finalItem: InventoryItem = {
            ...item,
            id: editingItem?.id || item.code,
            warehouseId: warehouseId!,
        };

        if (editingItem) {
            setInventory(inventory.map(i => (i.id === editingItem.id && i.warehouseId === editingItem.warehouseId) ? finalItem : i));
            toast({ title: t('product_updated'), description: t('inventory_item_updated') });
        } else {
             // Check if item code already exists in the same warehouse
            if (inventory.some(i => i.code.toLowerCase() === finalItem.code.toLowerCase() && i.warehouseId === finalItem.warehouseId)) {
                toast({
                    variant: 'destructive',
                    title: t('code_error'),
                    description: t('product_code_exists_in_warehouse', {code: finalItem.code})
                });
                return;
            }
            setInventory([finalItem, ...inventory]);
            toast({ title: t('product_created'), description: t('new_item_added_to_inventory') });
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
                title: t('no_warehouse_assigned'),
                description: t('cannot_add_products_without_warehouse')
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
          title: t('product_deleted'),
          description: t('inventory_item_deleted')
      });
    }
    
    const getStockStatus = (quantity: number): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
        if (quantity <= 0) return { text: t('out_of_stock'), variant: "destructive" };
        if (quantity < 20) return { text: t('low_stock'), variant: "secondary" };
        return { text: t('in_stock'), variant: "default" };
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('epp_products')}</h1>
                    <CardDescription>{t('manage_epp_stock')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                     {user?.role === 'admin' && (
                        <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <WarehouseIcon className="mr-2" />
                                <SelectValue placeholder={t('select_warehouse')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('all_warehouses')}</SelectItem>
                                {mockWarehouses.map(w => (
                                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Button onClick={handleAddNewClick} disabled={user?.role === 'reports'} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2" />
                        {t('add_product')}
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('code')}</TableHead>
                                <TableHead>{t('description')}</TableHead>
                                <TableHead>{t('size_unit')}</TableHead>
                                <TableHead className="text-right">{t('quantity')}</TableHead>
                                <TableHead className="text-right">{t('unit_cost')}</TableHead>
                                <TableHead>{t('status')}</TableHead>
                                {user?.role === 'admin' && <TableHead>{t('warehouse')}</TableHead>}
                                <TableHead className="text-right">{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleInventory.map((item) => {
                                const stockStatus = getStockStatus(item.quantity);
                                return (
                                    <TableRow key={`${item.id}-${item.warehouseId}`}>
                                        <TableCell className="font-medium">{item.code}</TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell>{item.size}</TableCell>
                                        <TableCell className="text-right">{item.quantity.toLocaleString(language)}</TableCell>
                                        <TableCell className="text-right">${item.cost.toLocaleString(language)}</TableCell>
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
                                                        {t('edit')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteItem(item.id, item.warehouseId)} className="text-destructive focus:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4"/>
                                                        {t('delete')}
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
                        <DialogTitle>{editingItem ? t('edit_product') : t('enter_new_product')}</DialogTitle>
                    </DialogHeader>
                    <ItemForm item={editingItem} onSave={handleSaveItem} />
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ItemForm({ item, onSave }: { item: InventoryItem | null, onSave: (data: FormData) => void }) {
    const { t } = useLanguage();
    return (
        <form action={onSave} className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="code">{t('code')}</Label>
                <Input id="code" name="code" defaultValue={item?.code} required disabled={!!item} />
            </div>
             <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="size">{t('size_unit')}</Label>
                <Input id="size" name="size" defaultValue={item?.size} required />
            </div>
            <div className="space-y-2 col-span-2">
                <Label htmlFor="description">{t('description')}</Label>
                <Input id="description" name="description" defaultValue={item?.description} required />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="quantity">{t('entry_quantity')}</Label>
                <Input id="quantity" name="quantity" type="number" defaultValue={item?.quantity} required min="0"/>
            </div>
             <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="cost">{t('price_unit_cost')}</Label>
                <Input id="cost" name="cost" type="number" step="0.01" defaultValue={item?.cost} required min="0"/>
            </div>
            
            <DialogFooter className="col-span-2">
                <DialogClose asChild>
                    <Button type="button" variant="outline">{t('cancel')}</Button>
                </DialogClose>
                <Button type="submit">{t('save')}</Button>
            </DialogFooter>
        </form>
    );
}
