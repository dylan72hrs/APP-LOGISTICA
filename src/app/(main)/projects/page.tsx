'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Project, ProjectStatus } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Upload, Download, Power } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/hooks/use-language';
import { useAuth } from '@/lib/hooks/use-auth';
import { useData } from '@/lib/hooks/use-data';

export default function ProjectsPage() {
    const { toast } = useToast();
    const { t } = useLanguage();
    const { user } = useAuth();
    const { projects, addProject, updateProject, deleteProject } = useData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveProject = (formData: FormData) => {
        const projectCode = String(formData.get('projectCode') ?? '').trim();
        const name = String(formData.get('name') ?? '').trim();
        const financialDimension = String(formData.get('financialDimension') ?? '').trim();
        const costCenter = String(formData.get('costCenter') ?? '').trim();
        const manager = String(formData.get('manager') ?? '').trim();
        const approver = String(formData.get('approver') ?? '').trim();
        const status: ProjectStatus = formData.get('status') === 'inactive' ? 'inactive' : 'active';

        if (!projectCode || !name || !costCenter || !financialDimension) {
            toast({
                variant: 'destructive',
                title: t('error'),
                description: 'Código, nombre, centro de costo y dimensión financiera son obligatorios.'
            });
            return;
        }

        const finalProject: Project = {
            id: editingProject?.id || projectCode,
            projectCode,
            name,
            financialDimension,
            costCenter,
            manager,
            approver,
            status,
        };

        if (editingProject) {
            updateProject(finalProject);
            toast({ title: t('project_updated'), description: t('project_updated_successfully') });
        } else {
            if (projects.some(p => p.id.toLowerCase() === finalProject.id.toLowerCase() || p.projectCode.toLowerCase() === projectCode.toLowerCase())) {
                toast({
                    variant: 'destructive',
                    title: t('id_error'),
                    description: t('project_id_exists', { id: finalProject.id })
                });
                return;
            }
            addProject(finalProject);
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

    const handleToggleStatus = (project: Project) => {
        const nextStatus: ProjectStatus = project.status === 'active' ? 'inactive' : 'active';
        updateProject({ ...project, status: nextStatus });
        toast({
            title: t('project_updated'),
            description: nextStatus === 'active'
                ? `Proyecto ${project.projectCode} activado.`
                : `Proyecto ${project.projectCode} desactivado. No se podrá usar en consumos nuevos.`,
        });
    }

    const handleDeleteClick = (id: string) => {
        deleteProject(id);
        toast({
          variant: "destructive",
          title: t('project_deleted'),
          description: t('project_deleted_successfully')
      });
    }

    const handleDownloadTemplate = async () => {
        const XLSX = await import('xlsx');
        const headers = [['Código de Proyecto', 'Nombre de Proyecto', 'Dimensión Financiera', 'Centro de Costo', 'Administrador/Encargado', 'Aprobador', 'Estado (activo/inactivo)']];
        const ws = XLSX.utils.aoa_to_sheet(headers);
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
        reader.onload = async (e) => {
            try {
                const XLSX = await import('xlsx');
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const existingIDs = new Set(projects.map(p => p.id.toLowerCase()));
                let projectsAdded = 0;

                // Skip header row (index 0)
                for (let i = 1; i < json.length; i++) {
                    const row = json[i];
                    const projectCode = row[0];
                    const name = row[1];
                    const financialDimension = row[2];
                    const costCenter = row[3];
                    const manager = row[4];
                    const approver = row[5];
                    const statusRaw = String(row[6] ?? '').trim().toLowerCase();

                    if (!projectCode || !name || !financialDimension || !costCenter) {
                        console.warn('Skipping invalid row:', row);
                        continue;
                    }

                    if (existingIDs.has(String(projectCode).toLowerCase())) {
                       console.warn(`Skipping existing project code: ${projectCode}`);
                       continue;
                    }

                    const newProject: Project = {
                        id: String(projectCode),
                        projectCode: String(projectCode),
                        name: String(name),
                        financialDimension: String(financialDimension),
                        costCenter: String(costCenter),
                        manager: manager ? String(manager) : '',
                        approver: approver ? String(approver) : '',
                        status: statusRaw === 'inactivo' || statusRaw === 'inactive' ? 'inactive' : 'active',
                    };
                    addProject(newProject);
                    existingIDs.add(newProject.id.toLowerCase());
                    projectsAdded++;
                }

                toast({
                    title: t('import_successful'),
                    description: t('new_projects_imported_successfully', { count: projectsAdded.toString() })
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
                                <TableHead>{t('project_code')}</TableHead>
                                <TableHead>{t('project_name')}</TableHead>
                                <TableHead>{t('financial_dimension')}</TableHead>
                                <TableHead>{t('cost_center')}</TableHead>
                                <TableHead>{t('project_manager')}</TableHead>
                                <TableHead>{t('project_approver')}</TableHead>
                                <TableHead>{t('status')}</TableHead>
                                <TableHead className="text-right">{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projects.map((project) => (
                                <TableRow key={project.id}>
                                    <TableCell className="font-medium">{project.projectCode}</TableCell>
                                    <TableCell>{project.name}</TableCell>
                                    <TableCell>{project.financialDimension}</TableCell>
                                    <TableCell>{project.costCenter}</TableCell>
                                    <TableCell>{project.manager || 'N/A'}</TableCell>
                                    <TableCell>{project.approver || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                                            {project.status === 'active' ? t('project_active') : t('project_inactive')}
                                        </Badge>
                                    </TableCell>
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
                                                <DropdownMenuItem onClick={() => handleToggleStatus(project)} disabled={user?.role === 'reports'}>
                                                    <Power className="mr-2 h-4 w-4"/>
                                                    {project.status === 'active' ? 'Desactivar' : 'Activar'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteClick(project.id)} className="text-destructive focus:text-destructive" disabled={user?.role === 'reports'}>
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

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSave(formData);
    }

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="projectCode">{t('project_code')}</Label>
                <Input id="projectCode" name="projectCode" defaultValue={project?.projectCode} placeholder="CL01" required disabled={!!project} />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="status">{t('status')}</Label>
                <Select name="status" defaultValue={project?.status ?? 'active'}>
                    <SelectTrigger id="status">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">{t('project_active')}</SelectItem>
                        <SelectItem value="inactive">{t('project_inactive')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2 col-span-2">
                <Label htmlFor="name">{t('project_name')}</Label>
                <Input id="name" name="name" defaultValue={project?.name} required />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="financialDimension">{t('financial_dimension')}</Label>
                <Input id="financialDimension" name="financialDimension" defaultValue={project?.financialDimension} required />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="costCenter">{t('cost_center')}</Label>
                <Input id="costCenter" name="costCenter" defaultValue={project?.costCenter} required />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="manager">{t('project_manager')}</Label>
                <Input id="manager" name="manager" defaultValue={project?.manager} />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="approver">{t('project_approver')}</Label>
                <Input id="approver" name="approver" defaultValue={project?.approver} />
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
