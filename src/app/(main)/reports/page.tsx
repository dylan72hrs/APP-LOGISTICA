'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/lib/hooks/use-language';
import { useData } from '@/lib/hooks/use-data';
import type { Project, Worker } from '@/lib/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';


export default function ReportsPage() {
    const { t } = useLanguage();
    const { workers, projects } = useData();
    const { toast } = useToast();

    const [filterType, setFilterType] = useState<'worker' | 'project'>('worker');
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    const [openWorkerCombobox, setOpenWorkerCombobox] = useState(false);
    const [openProjectCombobox, setOpenProjectCombobox] = useState(false);

    const handleGenerateReport = () => {
        if (!startDate || !endDate) {
            toast({
                variant: 'destructive',
                title: t('error'),
                description: 'Por favor, seleccione un rango de fechas válido.'
            });
            return;
        }

        if (startDate > endDate) {
            toast({
                variant: 'destructive',
                title: t('error'),
                description: 'La fecha de inicio no puede ser posterior a la fecha de fin.'
            });
            return;
        }

        // Logic to generate report will be implemented here
        console.log({
            filterType,
            selectedWorker,
            selectedProject,
            startDate,
            endDate
        });

        toast({
            title: 'Informe Generado (simulación)',
            description: `Filtros aplicados: ${filterType}, Fechas: ${format(startDate, 'PPP', { locale: es })} - ${format(endDate, 'PPP', { locale: es })}`
        })
    }

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('reports_and_analytics')}</h1>
                <CardDescription>{t('generate_view_export_reports')}</CardDescription>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('filters')}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Date Pickers */}
                    <div className="space-y-2">
                        <Label>{t('start_date')}</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP", { locale: es }) : <span>{t('pick_a_date')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={setStartDate}
                                    initialFocus
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('end_date')}</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !endDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP", { locale: es }) : <span>{t('pick_a_date')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={setEndDate}
                                    initialFocus
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Spacer to align next items */}
                    <div className="hidden lg:block"></div>

                    {/* Filter Type */}
                    <div className="space-y-2">
                        <Label>{t('report_type')}</Label>
                        <RadioGroup defaultValue="worker" onValueChange={(value: 'worker' | 'project') => {
                            setFilterType(value);
                            setSelectedProject(null);
                            setSelectedWorker(null);
                        }} className="flex items-center space-x-4 pt-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="worker" id="r-worker" />
                                <Label htmlFor="r-worker">{t('worker')}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="project" id="r-project" />
                                <Label htmlFor="r-project">{t('project')}</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Worker/Project Selector */}
                    <div className="space-y-2">
                        <Label>{filterType === 'worker' ? t('worker') : t('project')}</Label>
                        {filterType === 'worker' ? (
                             <>
                                <Popover open={openWorkerCombobox} onOpenChange={setOpenWorkerCombobox}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between">
                                            {selectedWorker?.name ?? t('select_a_worker')}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder={t('search_worker')} />
                                            <CommandList>
                                                <CommandEmpty>{t('no_results_found')}</CommandEmpty>
                                                <CommandGroup>
                                                    {workers.map(worker => (
                                                        <CommandItem
                                                            key={worker.id}
                                                            value={`${worker.name} ${worker.rut}`}
                                                            onSelect={() => {
                                                                setSelectedWorker(worker);
                                                                setOpenWorkerCombobox(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedWorker?.id === worker.id ? "opacity-100" : "opacity-0")} />
                                                            {worker.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </>
                        ) : (
                            <>
                                <Popover open={openProjectCombobox} onOpenChange={setOpenProjectCombobox}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between">
                                            {selectedProject?.name ?? t('select_a_project')}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder={t('search_project')} />
                                            <CommandList>
                                                <CommandEmpty>{t('no_results_found')}</CommandEmpty>
                                                <CommandGroup>
                                                    {projects.map(project => (
                                                        <CommandItem
                                                            key={project.id}
                                                            value={`${project.name} ${project.id}`}
                                                            onSelect={() => {
                                                                setSelectedProject(project);
                                                                setOpenProjectCombobox(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedProject?.id === project.id ? "opacity-100" : "opacity-0")} />
                                                            {project.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </>
                        )}
                    </div>

                    <div className="lg:col-start-3 flex justify-end items-end">
                        <Button onClick={handleGenerateReport}>{t('generate_report')}</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Placeholder for Report Results */}
            <Card>
              <CardHeader>
                <CardTitle>{t('report_results')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
                  <p className="text-muted-foreground">{t('generate_report_to_see_results')}</p>
                </div>
              </CardContent>
            </Card>
        </div>
    );
}
