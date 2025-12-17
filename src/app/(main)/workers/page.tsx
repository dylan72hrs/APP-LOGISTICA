'use client';

import { useState, useRef } from 'react';
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
import * as XLSX from 'xlsx';
import { useAuth } from '@/lib/hooks/use-auth';
import { useData } from '@/lib/hooks/use-data';

export default function WorkersPage() {
    const { toast } = useToast();
    const { t } = useLanguage();
    const { user } = useAuth();
    const { workers, addWorker, updateWorker, deleteWorker } = useData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveWorker = (formData: FormData) => {
        const worker: Omit<Worker, 'id'> & { id?: string } = {
            rut: formData.get('rut') as string,
            name: formData.get('name') as string,
            position: formData.get('position') as string,
            department: formData.get('department') as string,
        };

        if (!worker.rut || !worker.name || !worker.position || !worker.department) {
            toast({
                variant: 'destructive',
                title: t('error'),
                description: t('please_fill_all_fields_correctly')
            });
            return;
        }

        const finalWorker: Worker = {
            ...worker,
            id: editingWorker?.id || worker.rut,
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

    const handleDownloadTemplate = () => {
        const headers = [t('rut'), t('full_name'), t('position'), t('department')];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Trabajadores');
        XLSX.writeFile(wb, 'plantilla_trabajadores.xlsx');
    };

    const handleImportClick = () => {
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
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                const existingRUTs = new Set(workers.map(w => w.rut.toLowerCase()));
                
                for (const row of json) {
                    const rut = row[t('rut')];
                    const name = row[t('full_name')];
                    const position = row[t('position')];
                    const department = row[t('department')];
                    
                    if (!rut || !name || !position || !department) {
                        throw new Error(t('invalid_row_data_in_excel'));
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
                    };
                    addWorker(newWorker);
                    existingRUTs.add(newWorker.rut.toLowerCase());
                }

                toast({
                    title: t('import_successful'),
                    description: t('new_workers_imported_successfully', { count: json.length.toString() })
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
                            {workers.map((worker) => (
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

    