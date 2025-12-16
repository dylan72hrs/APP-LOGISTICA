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
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';


export default function ReportsPage() {
    const { t } = useLanguage();
    const { workers, projects, consumptionRecords } = useData();
    const { toast } = useToast();

    const [filterType, setFilterType] = useState<'worker' | 'project'>('worker');
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const [openWorkerCombobox, setOpenWorkerCombobox] = useState(false);
    const [openProjectCombobox, setOpenProjectCombobox] = useState(false);

    const handleGenerateReport = () => {
        if (!dateRange?.from || !dateRange?.to) {
            toast({
                variant: 'destructive',
                title: t('error'),
                description: 'Por favor, seleccione un rango de fechas válido.'
            });
            return;
        }

        if (dateRange.from > dateRange.to) {
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
            dateRange
        });

        toast({
            title: 'Informe Generado (simulación)',
            description: `Filtros aplicados: ${filterType}, Fechas: ${format(dateRange.from, 'PPP', { locale: es })} - ${format(dateRange.to, 'PPP', { locale: es })}`
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
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Date Range Picker */}
                    <div className="space-y-2 md:col-span-1">
                        <Label>{t('date_range')}</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                                                {format(dateRange.to, "LLL dd, y", { locale: es })}
                                            </>
                                        ) : (
                                            format(dateRange.from, "LLL dd, y", { locale: es })
                                        )
                                    ) : (
                                        <span>{t('pick_a_date')}</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                 <div className='p-4 font-semibold text-center'>{('Seleccione el rango de fechas')}</div>
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Filter Type */}
                    <div className="space-y-2 md:col-span-1">
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
                    <div className="space-y-2 md:col-span-1">
                        {filterType === 'worker' ? (
                             <>
                                <Label>{t('worker')}</Label>
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
                                <Label>{t('project')}</Label>
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

                    <div className="md:col-span-3 flex justify-end">
                        <Button onClick={handleGenerateReport}>{t('generate_report')}</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
