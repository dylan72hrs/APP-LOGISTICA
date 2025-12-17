'use client';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/lib/hooks/use-language';
import { useData } from '@/lib/hooks/use-data';
import type { Worker, InventoryItem, ConsumptionRecord } from '@/lib/types';
import { Calendar as CalendarIcon, Printer, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReporteTrabajador, type WorkerReportData } from '@/components/reporte-trabajador';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

type DateFilterType = 'week' | 'month' | 'year' | 'range';

export default function ReportsPage() {
    const { t, language } = useLanguage();
    const { workers, consumptionRecords, inventory } = useData();
    const { toast } = useToast();

    const [workerRutInput, setWorkerRutInput] = useState('');
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    
    const [dateFilterType, setDateFilterType] = useState<DateFilterType>('week');
    const [startDate, setStartDate] = useState<Date | undefined>(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [endDate, setEndDate] = useState<Date | undefined>(endOfWeek(new Date(), { weekStartsOn: 1 }));
    
    const [reportData, setReportData] = useState<WorkerReportData | null>(null);

    const handleWorkerSearch = () => {
        const foundWorker = workers.find(w => w.rut.replace(/[.-]/g, '') === workerRutInput.replace(/[.-]/g, ''));
        if (foundWorker) {
            setSelectedWorker(foundWorker);
            generateReport(foundWorker, startDate, endDate);
        } else {
            setSelectedWorker(null);
            setReportData(null);
            toast({ variant: 'destructive', title: t('error'), description: t('worker_not_found') });
        }
    }

    const handleDateFilterChange = (filter: DateFilterType) => {
        setDateFilterType(filter);
        const now = new Date();
        if (filter === 'week') {
            setStartDate(startOfWeek(now, { weekStartsOn: 1 }));
            setEndDate(endOfWeek(now, { weekStartsOn: 1 }));
        } else if (filter === 'month') {
            setStartDate(startOfMonth(now));
            setEndDate(endOfMonth(now));
        } else if (filter === 'year') {
            setStartDate(startOfYear(now));
            setEndDate(endOfYear(now));
        } else { // range
            setStartDate(undefined);
            setEndDate(undefined);
        }
    }
    
    // Auto-generate report when dates change
    useEffect(() => {
        if (selectedWorker && startDate && endDate) {
            generateReport(selectedWorker, startDate, endDate);
        }
         if (selectedWorker && dateFilterType !== 'range') {
            generateReport(selectedWorker, startDate, endDate);
        }
    }, [selectedWorker, startDate, endDate, dateFilterType]);


    const generateReport = (worker: Worker, start: Date | undefined, end: Date | undefined) => {
        if (!start || !end) {
             setReportData(null);
            return;
        }

        if (start > end) {
            toast({
                variant: 'destructive',
                title: t('error'),
                description: 'La fecha de inicio no puede ser posterior a la fecha de fin.'
            });
            return;
        }
        
        const workerConsumptions = consumptionRecords.filter(record => 
            record.workerId === worker.id &&
            record.date >= start &&
            record.date <= end
        );

        const itemsConsumed = workerConsumptions.flatMap(record => 
            record.items.map(item => {
                const inventoryItem = inventory.find(inv => inv.id === item.itemId && inv.warehouseId === record.warehouseId);
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
            startDate: start,
            endDate: end,
            worker: worker,
            items: itemsConsumed,
            totalItemsConsumed: totalItems,
        };
        
        setReportData(generatedReport);
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
                <h1 className="text-2xl font-bold tracking-tight">{t('ficha_consumo_trabajador')}</h1>
                <CardDescription>{t('search_worker_by_rut')}</CardDescription>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('filters')}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                     <div className="space-y-2 lg:col-span-1">
                        <Label htmlFor='worker-rut-input'>{t('worker_rut')}</Label>
                        <div className='flex gap-2'>
                            <Input
                                id="worker-rut-input"
                                value={workerRutInput}
                                onChange={e => setWorkerRutInput(e.target.value)}
                                placeholder={t('enter_rut_and_search')}
                                onKeyDown={(e) => e.key === 'Enter' && handleWorkerSearch()}
                            />
                            <Button onClick={handleWorkerSearch} variant="outline" size="icon">
                                <Search />
                            </Button>
                        </div>
                    </div>
                    
                    <div className="space-y-2 lg:col-span-2">
                        <Label>{t('date_range')}</Label>
                        <div className="flex flex-wrap gap-2 items-center">
                            <Button variant={dateFilterType === 'week' ? 'default' : 'outline'} onClick={() => handleDateFilterChange('week')}>{t('week')}</Button>
                            <Button variant={dateFilterType === 'month' ? 'default' : 'outline'} onClick={() => handleDateFilterChange('month')}>{t('month')}</Button>
                            <Button variant={dateFilterType === 'year' ? 'default' : 'outline'} onClick={() => handleDateFilterChange('year')}>{t('year')}</Button>
                            <Button variant={dateFilterType === 'range' ? 'default' : 'outline'} onClick={() => handleDateFilterChange('range')}>{t('range')}</Button>
                            
                            {dateFilterType === 'range' && (
                                <div className="flex gap-2 items-center">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-[200px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {startDate ? format(startDate, "PPP", { locale: es }) : <span>{t('start_date')}</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={es} />
                                        </PopoverContent>
                                    </Popover>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-[200px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {endDate ? format(endDate, "PPP", { locale: es }) : <span>{t('end_date')}</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={es} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {selectedWorker && reportData && (
                 <Card>
                    <CardHeader className='flex-row items-start justify-between'>
                        <div>
                            <CardTitle className="text-xl">{selectedWorker.name}</CardTitle>
                            <div className='text-sm text-muted-foreground space-x-4'>
                                <span><strong>{t('rut')}:</strong> {selectedWorker.rut}</span>
                                <span><strong>{t('position')}:</strong> {selectedWorker.position}</span>
                                <span><strong>{t('department')}:</strong> {selectedWorker.department}</span>
                            </div>
                        </div>
                        <Button onClick={handlePrintReport} variant="outline" size="sm">
                            <Printer className="mr-2 h-4 w-4"/>
                            {t('print_report')}
                        </Button>
                    </CardHeader>
                    <CardContent>
                         <p className="text-sm text-muted-foreground mb-4">
                            {t('showing_results_for')}: <strong>{format(reportData.startDate, "P", { locale: es })}</strong> - <strong>{format(reportData.endDate, "P", { locale: es })}</strong>
                        </p>
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
                                {reportData.items.length > 0 ? reportData.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.date.toLocaleDateString(language)}</TableCell>
                                        <TableCell>{item.code}</TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className='text-right'>{item.quantity}</TableCell>
                                    </TableRow>
                                )) : (
                                     <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">{t('no_consumptions_in_period')}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                         <div className="text-right font-bold mt-4 pr-4">
                            {t('total_items_consumed')}: {reportData.totalItemsConsumed}
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
