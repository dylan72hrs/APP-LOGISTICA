'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockProjects as initialProjects } from '@/lib/data';
import type { Project } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/hooks/use-language';
import * as XLSX from 'xlsx';
import { useAuth } from '@/lib/hooks/use-auth';

export default function ProjectsPage() {
    const { toast } = useToast();
    const { t } = useLanguage();
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveProject = (formData: FormData) => {
        const project: Omit<Project, 'id'> & { id?: string } = {
            id: formData.get('id') as string,
            financialDimension: formData.get('financialDimension') as string,
            name: formData.get('name') as string,
            manager: formData.get('manager') as string,
            approver: formData.get('approver') as string,
        };

        if (!project.id || !project.name || !project.manager || !project.approver) {
            toast({
                variant: 'destructive',
                title: t('error'),
                description: t('please_fill_all_fields_correctly')
            });
            return;
        }

        const finalProject: Project = {
            ...project,
            id: editingProject?.id || project.id,
        };

        if (editingProject) {
            setProjects(projects.map(p => p.id === editingProject.id ? finalProject : p));
            toast({ title: t('project_updated'), description: t('project_updated_successfully') });
        } else {
            if (projects.some(p => p.id.toLowerCase() === finalProject.id.toLowerCase())) {
                toast({
                    variant: 'destructive',
                    title: t('id_error'),
                    description: t('project_id_exists', { id: finalProject.id })
                });
                return;
            }
            setProjects([finalProject, ...projects]);
            toast({ title: t('project_created'), description: t('new_project_added_successfully') });
        }
        
        setIsDialogOpen(false);
        setEditingProject(null);
    };

    const handleEditClick = (project: Project) => {
        setEditingProject(project);
        setIsDialogOpen(true);
    }
    
    const handleAddNewClick = () => {
        setEditingProject(null);
        setIsDialogOpen(true);
    }

    const handleDeleteProject = (id: string) => {
        setProjects(projects.filter(p => p.id !== id));
        toast({
          variant: "destructive",
          title: t('project_deleted'),
          description: t('project_deleted_successfully')
      });
    }

    const handleDownloadTemplate = () => {
        const headers = [t('project_id'), t('financial_dimension'), t('project_name'), t('project_manager'), t('project_approver')];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Proyectos');
        XLSX.writeFile(wb, 'plantilla_proyectos.xlsx');
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

                const newProjects: Project[] = [];
                const existingIDs = new Set(projects.map(p => p.id.toLowerCase()));
                
                for (const row of json) {
                    const id = row[t('project_id')];
                    const financialDimension = row[t('financial_dimension')];
                    const name = row[t('project_name')];
                    const manager = row[t('project_manager')];
                    const approver = row[t('project_approver')];
                    
                    if (!id || !name || !manager || !approver) {
                        throw new Error(t('invalid_row_data_in_excel'));
                    }

                    if (existingIDs.has(String(id).toLowerCase())) {
                       console.warn(`Skipping existing project ID: ${id}`);
                       continue;
                    }

                    const newProject: Project = {
                        id: String(id),
                        financialDimension: String(financialDimension),
                        name: String(name),
                        manager: String(manager),
                        approver: String(approver),
                    };
                    newProjects.push(newProject);
                    existingIDs.add(newProject.id.toLowerCase());
                }

                setProjects(prev => [...newProjects, ...prev]);
                toast({
                    title: t('import_successful'),
                    description: t('new_projects_imported_successfully', { count: newProjects.length.toString() })
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
                    <h1 className="text-2xl font-bold tracking-tight">{t('project_management')}</h1>
                    <CardDescription>{t('manage_projects_associated_with_consumptions')}</CardDescription>
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
                        {t('add_project')}
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('project_id')}</TableHead>
                                <TableHead>{t('project_name')}</TableHead>
                                <TableHead>{t('financial_dimension')}</TableHead>
                                <TableHead>{t('project_manager')}</TableHead>
                                <TableHead>{t('project_approver')}</TableHead>
                                <TableHead className="text-right">{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projects.map((project) => (
                                <TableRow key={project.id}>
                                    <TableCell className="font-medium">{project.id}</TableCell>
                                    <TableCell>{project.name}</TableCell>
                                    <TableCell>{project.financialDimension}</TableCell>
                                    <TableCell>{project.manager}</TableCell>
                                    <TableCell>{project.approver}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleEditClick(project)} disabled={user?.role === 'reports'}>
                                                    <Pencil className="mr-2 h-4 w-4"/>
                                                    {t('edit')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteProject(project.id)} className="text-destructive focus:text-destructive" disabled={user?.role === 'reports'}>
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
                if (!open) setEditingProject(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingProject ? t('edit_project') : t('add_new_project')}</DialogTitle>
                    </DialogHeader>
                    <ProjectForm project={editingProject} onSave={handleSaveProject} />
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ProjectForm({ project, onSave }: { project: Project | null, onSave: (data: FormData) => void }) {
    const { t } = useLanguage();
    return (
        <form action={onSave} className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="id">{t('project_id')}</Label>
                <Input id="id" name="id" defaultValue={project?.id} required disabled={!!project} />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="financialDimension">{t('financial_dimension')}</Label>
                <Input id="financialDimension" name="financialDimension" defaultValue={project?.financialDimension} />
            </div>
            <div className="space-y-2 col-span-2">
                <Label htmlFor="name">{t('project_name')}</Label>
                <Input id="name" name="name" defaultValue={project?.name} required />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="manager">{t('project_manager')}</Label>
                <Input id="manager" name="manager" defaultValue={project?.manager} required />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="approver">{t('project_approver')}</Label>
                <Input id="approver" name="approver" defaultValue={project?.approver} required />
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
