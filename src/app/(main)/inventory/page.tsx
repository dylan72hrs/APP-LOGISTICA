'use client';

import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { InventoryItem } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Warehouse as WarehouseIcon, Upload, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/hooks/use-language';
import * as XLSX from 'xlsx';
import { useWarehouse } from '@/lib/hooks/use-warehouse';
import { useData } from '@/lib/hooks/use-data';

export default function InventoryPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const { selectedWarehouseId, availableWarehouses } = useWarehouse();
    const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useData();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const visibleInventory = useMemo(() => {
        if (!user) return [];

        if (selectedWarehouseId === 'all') {
            if (user.role === 'reports') {
                 const countryWarehouseIds = availableWarehouses.map(w => w.id);
                 return inventory.filter(item => countryWarehouseIds.includes(item.warehouseId));
            }
            return inventory;
        }

        return inventory.filter(item => item.warehouseId === selectedWarehouseId);

    }, [user, inventory, selectedWarehouseId, availableWarehouses]);

    const handleSaveItem = (formData: FormData) => {
        const newItemData = {
            code: formData.get('code') as string,
            description: formData.get('description') as string,
            size: formData.get('size') as string,
            quantity: parseInt(formData.get('quantity') as string, 10),
            cost: parseFloat(formData.get('cost') as string),
        };

        if (!newItemData.code || !newItemData.description || !newItemData.size || isNaN(newItemData.quantity) || isNaN(newItemData.cost)) {
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
                if (selectedWarehouseId && selectedWarehouseId !== 'all') {
                    warehouseId = selectedWarehouseId;
                } else {
                     toast({
                        variant: 'destructive',
                        title: t('no_warehouse_selected'),
                        description: t('admin_select_warehouse_for_product')
                    });
                    return;
                }
            }
        }
        if (!warehouseId) return; // Should not happen with the checks above

        if (editingItem) {
            const updatedItem: InventoryItem = {
                ...editingItem,
                ...newItemData,
            };
            updateInventoryItem(updatedItem);
            toast({ title: t('product_updated'), description: t('inventory_item_updated') });
        } else {
            const existingItem = inventory.find(i => i.code.toLowerCase() === newItemData.code.toLowerCase() && i.warehouseId === warehouseId);
            if (existingItem) {
                // If item exists, update its quantity and cost
                const updatedItem: InventoryItem = {
                    ...existingItem,
                    quantity: existingItem.quantity + newItemData.quantity,
                    cost: newItemData.cost, // Update cost to the latest price
                    description: newItemData.description,
                    size: newItemData.size,
                };
                updateInventoryItem(updatedItem);
                toast({ title: t('product_updated'), description: `Se agregaron ${newItemData.quantity} unidades al stock.` });

            } else {
                // If item does not exist, create it
                const finalItem: InventoryItem = {
                    ...newItemData,
                    id: newItemData.code,
                    warehouseId: warehouseId!,
                };
                addInventoryItem(finalItem);
                toast({ title: t('product_created'), description: t('new_item_added_to_inventory') });
            }
        }
        
        setIsDialogOpen(false);
        setEditingItem(null);
    };

    const handleEditClick = (item: InventoryItem) => {
        setEditingItem(item);
        setIsDialogOpen(true);
    }
    
    const handleAddNewClick = () => {
         if (user?.role === 'admin' && selectedWarehouseId === 'all') {
            toast({
                variant: 'destructive',
                title: t('no_warehouse_selected'),
                description: t('admin_select_warehouse_for_product')
            });
            return;
        }
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
        deleteInventoryItem(id, warehouseId);
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

    const handleDownloadTemplate = () => {
        const headers = [['Código', 'Descripción', 'Talla / U. Medida', 'Cantidad', 'Costo Unitario']];
        const ws = XLSX.utils.aoa_to_sheet(headers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
        XLSX.writeFile(wb, 'plantilla_productos_epp.xlsx');
    };

    const handleImportClick = () => {
        const warehouseForUpload = user?.role === 'admin' ? selectedWarehouseId : user?.warehouseId;

        if (!warehouseForUpload || warehouseForUpload === 'all') {
            toast({
                variant: 'destructive',
                title: t('no_warehouse_selected'),
                description: t('admin_select_warehouse_for_import')
            });
            return;
        }
       
        fileInputRef.current?.click();
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                let warehouseIdForUpload: string | undefined;

                if (user?.role === 'operator') {
                    warehouseIdForUpload = user.warehouseId;
                } else if (user?.role === 'admin') {
                    warehouseIdForUpload = selectedWarehouseId;
                }

                if (!warehouseIdForUpload || warehouseIdForUpload === 'all') {
                     toast({
                        variant: 'destructive',
                        title: t('no_warehouse_assigned'),
                        description: t('cannot_import_products_without_warehouse')
                    });
                    return;
                }

                let itemsAdded = 0;
                let itemsUpdated = 0;
                
                // Skip header row (index 0)
                for (let i = 1; i < json.length; i++) {
                    const row = json[i];
                    const code = row[0];
                    const description = row[1];
                    const size = row[2];
                    const quantity = parseInt(row[3], 10);
                    const cost = parseFloat(row[4]);
                    
                    if (!code || !description || !size || isNaN(quantity) || isNaN(cost)) {
                        console.warn('Skipping invalid row:', row);
                        continue;
                    }

                    const existingItem = inventory.find(i => i.code.toLowerCase() === String(code).toLowerCase() && i.warehouseId === warehouseIdForUpload);

                    if (existingItem) {
                        const updatedItem: InventoryItem = {
                            ...existingItem,
                            quantity: existingItem.quantity + quantity,
                            cost: cost,
                        };
                        updateInventoryItem(updatedItem);
                        itemsUpdated++;
                    } else {
                        const newItem: InventoryItem = {
                            id: String(code),
                            code: String(code),
                            description: String(description),
                            size: String(size),
                            quantity,
                            cost,
                            warehouseId: warehouseIdForUpload!,
                        };
                        addInventoryItem(newItem);
                        itemsAdded++;
                    }
                }

                toast({
                    title: t('import_successful'),
                    description: `${itemsAdded} ${t('items_created')}, ${itemsUpdated} ${t('items_updated')}.`
                });

            } catch (error) {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: t('import_error'),
                    description: error instanceof Error ? error.message : t('error_processing_excel')
                });
            } finally {
                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('epp_products')}</h1>
                    <CardDescription>{t('manage_epp_stock')}</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={handleDownloadTemplate} className="w-full sm:w-auto">
                        <Download className="mr-2"/>
                        {t('download_template')}
                    </Button>
                    <Button variant="outline" onClick={handleImportClick} disabled={user?.role === 'reports'} className="w-full sm:w-auto">
                        <Upload className="mr-2" />
                        {t('import_from_excel')}
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden"/>

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
                                {user?.role === 'admin' && selectedWarehouseId === 'all' && <TableHead>{t('warehouse')}</TableHead>}
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
                                        {user?.role === 'admin' && selectedWarehouseId === 'all' && <TableCell>{availableWarehouses.find(w => w.id === item.warehouseId)?.name}</TableCell>}
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
    const { inventory } = useData();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSave(formData);
    }
    
    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="code">{t('code')}</Label>
                <Input id="code" name="code" defaultValue={item?.code} required disabled={!!item} />
            </div>
             <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="size">{t('size_unit')}</Label>
                <Input id="size" name="size" defaultValue={item?.size} required disabled={!!item && inventory.some(i => i.code === item.code)} />
            </div>
            <div className="space-y-2 col-span-2">
                <Label htmlFor="description">{t('description')}</Label>
                <Input id="description" name="description" defaultValue={item?.description} required disabled={!!item && inventory.some(i => i.code === item.code)} />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="quantity">{t('entry_quantity')}</Label>
                <Input id="quantity" name="quantity" type="number" defaultValue={item ? undefined : ''} placeholder={item ? item.quantity.toString() : '0'} required min="0"/>
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
