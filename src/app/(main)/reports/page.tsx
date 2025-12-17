'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/lib/hooks/use-language';
import { useData } from '@/lib/hooks/use-data';
import type { Project, Worker, InventoryItem } from '@/lib/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check, Calendar as CalendarIcon, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReporteTrabajador, type WorkerReportData } from '@/components/reporte-trabajador';


export default function ReportsPage() {
    const { t, language } = useLanguage();
    const { workers, projects, consumptionRecords, inventory } = useData();
    const { toast } = useToast();

    const [filterType, setFilterType] = useState<'worker' | 'project'>('worker');
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    
    const [reportData, setReportData] = useState<WorkerReportData | null>(null);

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
        
        if (filterType === 'worker') {
            if (!selectedWorker) {
                toast({ variant: 'destructive', title: t('error'), description: 'Por favor, seleccione un trabajador.' });
                return;
            }
            
            const workerConsumptions = consumptionRecords.filter(record => 
                record.workerId === selectedWorker.id &&
                record.date >= startDate &&
                record.date <= endDate
            );

            const itemsConsumed = workerConsumptions.flatMap(record => 
                record.items.map(item => {
                    const inventoryItem = inventory.find(inv => inv.id === item.itemId);
                    return {
                        date: record.date,
                        code: inventoryItem?.code || 'N/A',
                        description: inventoryItem?.description || 'N/A',
                        quantity: item.quantity
                    }
                })
            ).sort((a, b) => a.date.getTime() - b.date.getTime());

            const totalItems = itemsConsumed.reduce((sum, item) => sum + item.quantity, 0);

            const generatedReport: WorkerReportData = {
                id: `REP-${Date.now()}`,
                generationDate: new Date(),
                startDate,
                endDate,
                worker: selectedWorker,
                items: itemsConsumed,
                totalItemsConsumed: totalItems,
            };
            
            setReportData(generatedReport);
            toast({ title: 'Informe Generado', description: `Se ha generado el informe para ${selectedWorker.name}.` });

        } else if (filterType === 'project') {
             if (!selectedProject) {
                toast({ variant: 'destructive', title: t('error'), description: 'Por favor, seleccione un proyecto.' });
                return;
            }
            // Logic for project report will be implemented here
            setReportData(null);
            toast({ title: 'Funcionalidad no implementada', description: 'La generación de informes por proyecto se implementará pronto.' });
        }
    }
    
    const handlePrintReport = () => {
        if (!reportData) return;

        setTimeout(() => {
            const reportContent = document.getElementById('report-for-print')?.innerHTML;
            if (reportContent) {
                const printWindow = window.open('', '_blank', 'width=800,height=600');
                if (printWindow) {
                    printWindow.document.write(`
                        <html>
                            <head>
                            <title>${t('consumption_report_for')} ${reportData.worker.name}</title>
                            <script src="https://cdn.tailwindcss.com"></script>
                            <style>
                                body { font-family: Arial, sans-serif; }
                                @media print {
                                #print-button { display: none; }
                                @page { 
                                    size: letter;
                                    margin: 0.5in; 
                                }
                                body {
                                    -webkit-print-color-adjust: exact;
                                    print-color-adjust: exact;
                                }
                                }
                            </style>
                            </head>
                            <body class="bg-white">
                                <div class="max-w-4xl mx-auto p-4">
                                ${reportContent}
                                 <div class="mt-8 text-center no-print">
                                    <button id="print-button" onclick="window.print()" class="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
                                        ${t('print')}
                                    </button>
                                </div>
                                </div>
                            </body>
                        </html>
                    `);
                    printWindow.document.close();
                }
            }
        }, 100);
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

                    <div className="hidden lg:block"></div>

                    <div className="space-y-2">
                        <Label>{t('report_type')}</Label>
                        <RadioGroup defaultValue="worker" onValueChange={(value: 'worker' | 'project') => {
                            setFilterType(value);
                            setSelectedProject(null);
                            setSelectedWorker(null);
                            setReportData(null);
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

            {reportData && (
                 <Card>
                    <CardHeader className='flex-row items-center justify-between'>
                        <div>
                            <CardTitle>{t('report_results')}</CardTitle>
                            <CardDescription>{t('consumption_report_for')} {reportData.worker.name}</CardDescription>
                        </div>
                        <Button onClick={handlePrintReport} variant="outline" size="sm">
                            <Printer className="mr-2 h-4 w-4"/>
                            {t('print')}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('date')}</TableHead>
                                    <TableHead>{t('code')}</TableHead>
                                    <TableHead>{t('description')}</TableHead>
                                    <TableHead className='text-right'>{t('quantity')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.date.toLocaleDateString(language)}</TableCell>
                                        <TableCell>{item.code}</TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className='text-right'>{item.quantity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         <div className="text-right font-bold mt-4 pr-4">
                            Total Items: {reportData.totalItemsConsumed}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Hidden component to generate HTML for printing */}
            <div className="hidden">
                <div id="report-for-print">
                    {reportData && <ReporteTrabajador data={reportData} />}
                </div>
            </div>
        </div>
    );
}