'use client';

import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Worker } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/hooks/use-language';
import { useAuth } from '@/lib/hooks/use-auth';
import { useData } from '@/lib/hooks/use-data';
import { useWarehouse } from '@/lib/hooks/use-warehouse';

export default function WorkersPage() {
    const { toast } = useToast();
    const { t } = useLanguage();
    const { user } = useAuth();
    const { workers, addWorker, updateWorker, deleteWorker } = useData();
    const { selectedWarehouseId } = useWarehouse();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const visibleWorkers = useMemo(() => {
        if (selectedWarehouseId === 'all') {
            return workers;
        }
        return workers.filter(worker => worker.warehouseId === selectedWarehouseId);
    }, [workers, selectedWarehouseId]);

    const handleSaveWorker = (formData: FormData) => {
        const rut = formData.get('rut') as string;
        const name = formData.get('name') as string;
        const position = formData.get('position') as string;
        const department = formData.get('department') as string;
        
        let warehouseId = editingWorker?.warehouseId;
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
                        description: t('admin_select_warehouse_for_worker')
                    });
                    return;
                }
            }
        }
        if (!warehouseId) return;

        if (!rut || !name || !position || !department) {
            toast({
                variant: 'destructive',
                title: t('error'),
                description: t('please_fill_all_fields_correctly')
            });
            return;
        }

        const finalWorker: Worker = {
            id: editingWorker?.id || rut,
            rut,
            name,
            position,
            department,
            warehouseId
        };

        if (editingWorker) {
            updateWorker(finalWorker);
            toast({ title: t('worker_updated'), description: t('worker_updated_successfully') });
        } else {
            if (workers.some(w => w.rut.toLowerCase() === finalWorker.rut.toLowerCase())) {
                toast({
                    variant: 'destructive',
                    title: t('rut_error'),
                    description: t('worker_rut_exists', { rut: finalWorker.rut })
                });
                return;
            }
            addWorker(finalWorker);
            toast({ title: t('worker_created'), description: t('new_worker_added_successfully') });
        }
        
        setIsDialogOpen(false);
        setEditingWorker(null);
    };

    const handleEditClick = (worker: Worker) => {
        setEditingWorker(worker);
        setIsDialogOpen(true);
    }
    
    const handleAddNewClick = () => {
         if (user?.role === 'admin' && selectedWarehouseId === 'all') {
            toast({
                variant: 'destructive',
                title: t('no_warehouse_selected'),
                description: t('admin_select_warehouse_for_worker')
            });
            return;
        }
        setEditingWorker(null);
        setIsDialogOpen(true);
    }

    const handleDeleteClick = (id: string) => {
        deleteWorker(id);
        toast({
          variant: "destructive",
          title: t('worker_deleted'),
          description: t('worker_deleted_successfully')
      });
    }

    const handleDownloadTemplate = async () => {
        const XLSX = await import('xlsx');
        const headers = [['RUT', 'Nombre Completo', 'Cargo', 'Sección']];
        const ws = XLSX.utils.aoa_to_sheet(headers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Trabajadores');
        XLSX.writeFile(wb, 'plantilla_trabajadores.xlsx');
    };

    const handleImportClick = () => {
        if (user?.role === 'admin' && selectedWarehouseId === 'all') {
            toast({
                variant: 'destructive',
                title: t('no_warehouse_selected'),
                description: t('admin_select_warehouse_for_worker_import')
            });
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const XLSX = await import('xlsx');
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
                    throw new Error(t('cannot_import_products_without_warehouse'));
                }

                const existingRUTs = new Set(workers.map(w => w.rut.toLowerCase()));
                let workersAdded = 0;
                
                // Skip header row (index 0)
                for (let i = 1; i < json.length; i++) {
                    const row = json[i];
                    const rut = row[0];
                    const name = row[1];
                    const position = row[2];
                    const department = row[3];
                    
                    if (!rut || !name || !position || !department) {
                        console.warn('Skipping invalid row:', row);
                        continue;
                    }

                    if (existingRUTs.has(String(rut).toLowerCase())) {
                       console.warn(`Skipping existing RUT: ${rut}`);
                       continue;
                    }

                    const newWorker: Worker = {
                        id: String(rut),
                        rut: String(rut),
                        name: String(name),
                        position: String(position),
                        department: String(department),
                        warehouseId: warehouseIdForUpload,
                    };
                    addWorker(newWorker);
                    existingRUTs.add(newWorker.rut.toLowerCase());
                    workersAdded++;
                }

                toast({
                    title: t('import_successful'),
                    description: t('new_workers_imported_successfully', { count: workersAdded.toString() })
                });

            } catch (error) {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: t('import_error'),
                    description: error instanceof Error ? error.message : t('error_processing_excel')
                });
            } finally {
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
                    <h1 className="text-2xl font-bold tracking-tight">{t('worker_management')}</h1>
                    <CardDescription>{t('manage_worker_information')}</CardDescription>
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
                        {t('add_worker')}
                    </Button>
                </div>
            </div>
            {user?.role === 'admin' && selectedWarehouseId === 'all' && (
                <CardDescription className='text-destructive -mt-2'>
                    {t('admin_select_warehouse_for_worker_management')}
                </CardDescription>
            )}

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('rut')}</TableHead>
                                <TableHead>{t('full_name')}</TableHead>
                                <TableHead>{t('position')}</TableHead>
                                <TableHead>{t('department')}</TableHead>
                                <TableHead className="text-right">{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleWorkers.map((worker) => (
                                <TableRow key={worker.id}>
                                    <TableCell className="font-medium">{worker.rut}</TableCell>
                                    <TableCell>{worker.name}</TableCell>
                                    <TableCell>{worker.position}</TableCell>
                                    <TableCell>{worker.department}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleEditClick(worker)} disabled={user?.role === 'reports'}>
                                                    <Pencil className="mr-2 h-4 w-4"/>
                                                    {t('edit')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteClick(worker.id)} className="text-destructive focus:text-destructive" disabled={user?.role === 'reports'}>
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
                if (!open) setEditingWorker(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingWorker ? t('edit_worker') : t('add_new_worker')}</DialogTitle>
                    </DialogHeader>
                    <WorkerForm worker={editingWorker} onSave={handleSaveWorker} />
                </DialogContent>
            </Dialog>
        </div>
    );
}

function WorkerForm({ worker, onSave }: { worker: Worker | null, onSave: (data: FormData) => void }) {
    const { t } = useLanguage();
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSave(formData);
    }
    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="rut">{t('rut')}</Label>
                <Input id="rut" name="rut" defaultValue={worker?.rut} required disabled={!!worker} />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="name">{t('full_name')}</Label>
                <Input id="name" name="name" defaultValue={worker?.name} required />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="position">{t('position')}</Label>
                <Input id="position" name="position" defaultValue={worker?.position} required />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="department">{t('department')}</Label>
                <Input id="department" name="department" defaultValue={worker?.department} required />
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
