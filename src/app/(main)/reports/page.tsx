'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es, fr, enUS } from 'date-fns/locale';
import { Download, Check, ChevronsUpDown, CalendarIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/hooks/use-language';
import * as XLSX from 'xlsx';
import { useData } from '@/lib/hooks/use-data';
import { Calendar } from '@/components/ui/calendar';

type ReportType = 'worker' | 'project';

interface ReportRow {
    date: string;
    code: string;
    description: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    // Project-specific fields
    projectId?: string;
    financialDimension?: string;
    projectName?: string;
    workerName?: string;
    workerRut?: string;
}

export default function ReportsPage() {
    const { t, language } = useLanguage();
    const { consumptionRecords, workers, projects, inventory } = useData();
    const [date, setDate] = useState<DateRange | undefined>(undefined);
    const [reportType, setReportType] = useState<ReportType>('worker');
    const [selectedId, setSelectedId] = useState<string>('');
    const [reportData, setReportData] = useState<ReportRow[]>([]);
    const [reportTitle, setReportTitle] = useState('');
    const [openCombobox, setOpenCombobox] = useState(false);

    const localeMap = {
        es: es,
        fr: fr,
        en: enUS
    };
    const currentLocale = localeMap[language as keyof typeof localeMap] || es;

    const handleGenerateReport = () => {
        if (!selectedId) {
            setReportData([]);
            return;
        }

        const filteredRecords = consumptionRecords.filter(record => {
            const recordDate = new Date(record.date);
recordDate.setHours(0,0,0,0);

            let isInDateRange = true;
            if (date?.from && date?.to) {
                 const fromDate = new Date(date.from!);
fromDate.setHours(0,0,0,0);
                
                const toDate = new Date(date.to!);
toDate.setHours(23,59,59,999);
                isInDateRange = recordDate >= fromDate && recordDate <= toDate;
            }
            
            if (reportType === 'worker') {
                return isInDateRange && record.workerId === selectedId;
            }
            if (reportType === 'project') {
                return isInDateRange && record.projectId === selectedId;
            }
            return false;
        });

        const generatedData: ReportRow[] = [];
        filteredRecords.forEach(record => {
            const projectInfo = projects.find(p => p.id === record.projectId);
            const workerInfo = workers.find(w => w.id === record.workerId);

            record.items.forEach(consumedItem => {
                const inventoryItem = inventory.find(inv => inv.id === consumedItem.itemId);
                if (inventoryItem) {
                    const row: ReportRow = {
                        date: new Date(record.date).toLocaleDateString(language),
                        code: inventoryItem.code,
                        description: inventoryItem.description,
                        quantity: consumedItem.quantity,
                        unitCost: inventoryItem.cost,
                        totalCost: consumedItem.quantity * inventoryItem.cost,
                    };
                    if (reportType === 'project') {
                        row.projectId = record.projectId;
                        row.financialDimension = projectInfo?.financialDimension;
                        row.projectName = projectInfo?.name;
                        row.workerName = workerInfo?.name;
                        row.workerRut = workerInfo?.rut;
                    }
                    generatedData.push(row);
                }
            });
        });

        setReportData(generatedData);
        
        let title = `${t('consumption_report_for')} `;
        if (reportType === 'worker') {
            title += workers.find(w => w.id === selectedId)?.name;
        } else {
            title += projects.find(p => p.id === selectedId)?.name;
        }
        if(date?.from && date?.to){
             title += ` (${format(date.from, 'PPP', {locale: currentLocale})} - ${format(date.to, 'PPP', {locale: currentLocale})})`;
        }
       
        setReportTitle(title);
    };

    const totalReportCost = useMemo(() => {
        return reportData.reduce((acc, row) => acc + row.totalCost, 0);
    }, [reportData]);

    const handleExportExcel = () => {
        if (reportData.length === 0) return;
        
        let headers: string[];
        let dataToExport: (string | number | undefined)[][];

        if (reportType === 'project') {
            headers = [
                t('date'), 
                t('project_id'), 
                t('financial_dimension'), 
                t('project_name'), 
                t('worker'), 
                t('rut'),
                t('code'), 
                t('description'), 
                t('quantity'), 
                t('unit_cost'), 
                t('total_cost')
            ];
            dataToExport = reportData.map(row => [
                row.date,
                row.projectId,
                row.financialDimension,
                row.projectName,
                row.workerName,
                row.workerRut,
                row.code,
                row.description,
                row.quantity,
                row.unitCost,
                row.totalCost,
            ]);
        } else {
             headers = [t('date'), t('code'), t('description'), t('quantity'), t('unit_cost'), t('total_cost')];
             dataToExport = reportData.map(row => [
                row.date,
                row.code,
                row.description,
                row.quantity,
                row.unitCost,
                row.totalCost,
            ]);
        }
        
        const ws = XLSX.utils.aoa_to_sheet([headers, ...dataToExport]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Consumos");
        XLSX.writeFile(wb, "reporte_consumos.xlsx");
    }

    const currentSelectionLabel = useMemo(() => {
        if (!selectedId) return reportType === 'worker' ? t('select_a_worker') : t('select_a_project');
        if (reportType === 'worker') {
            return workers.find(w => w.id === selectedId)?.name || t('select_a_worker');
        }
        return projects.find(p => p.id === selectedId)?.name || t('select_a_project');
    }, [selectedId, reportType, workers, projects, t]);

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
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                     <div className="space-y-2">
                        <Label>{t('report_type')}</Label>
                        <RadioGroup defaultValue="worker" value={reportType} onValueChange={(value: string) => {
                            setReportType(value as ReportType);
                            setSelectedId('');
                            setReportData([]);
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
                         <Label htmlFor="select-entity">{reportType === 'worker' ? t('worker') : t('project')}</Label>
                         <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCombobox}
                                className="w-full justify-between"
                                >
                                {currentSelectionLabel}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                <CommandInput placeholder={reportType === 'worker' ? t('search_worker') : t('search_project')} />
                                <CommandList>
                                    <CommandEmpty>{t('no_results_found')}</CommandEmpty>
                                    <CommandGroup>
                                        {(reportType === 'worker' ? workers : projects).map(item => (
                                            <CommandItem
                                                key={item.id}
                                                value={`${item.name} ${reportType === 'worker' ? (item as any).rut : item.id}`}
                                                onSelect={() => {
                                                    setSelectedId(item.id);
                                                    setOpenCombobox(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedId === item.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {item.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label>{t('start_date')}</Label>
                                        <Button
                                            id="date-from"
                                            variant={"outline"}
                                            className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date?.from && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date?.from ? format(date.from, 'PPP', { locale: currentLocale }) : <span>{t('pick_a_date')}</span>}
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('end_date')}</Label>
                                        <Button
                                            id="date-to"
                                            variant={"outline"}
                                            className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date?.to && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date?.to ? format(date.to, 'PPP', { locale: currentLocale }) : <span>{t('pick_a_date')}</span>}
                                        </Button>
                                    </div>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                    locale={currentLocale}
                                />
                            </PopoverContent>
                        </Popover>
                        <Button onClick={handleGenerateReport} className="w-full sm:w-auto sm:justify-self-start">{t('generate_report')}</Button>
                    </div>
                </CardContent>
            </Card>

            {reportData.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{t('report_results')}</CardTitle>
                            <CardDescription>{reportTitle}</CardDescription>
                        </div>
                        <Button onClick={handleExportExcel} variant="outline">
                            <Download className="mr-2" />
                            {t('export_to_excel')}
                        </Button>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('date')}</TableHead>
                                    {reportType === 'project' && (
                                        <>
                                            <TableHead>{t('project_id')}</TableHead>
                                            <TableHead>{t('financial_dimension')}</TableHead>
                                            <TableHead>{t('project_name')}</TableHead>
                                            <TableHead>{t('worker')}</TableHead>
                                            <TableHead>{t('rut')}</TableHead>
                                        </>
                                    )}
                                    <TableHead>{t('code')}</TableHead>
                                    <TableHead>{t('description')}</TableHead>
                                    <TableHead className="text-right">{t('quantity')}</TableHead>
                                    <TableHead className="text-right">{t('unit_cost')}</TableHead>
                                    <TableHead className="text-right">{t('total_cost')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{row.date}</TableCell>
                                        {reportType === 'project' && (
                                            <>
                                                <TableCell>{row.projectId}</TableCell>
                                                <TableCell>{row.financialDimension}</TableCell>
                                                <TableCell>{row.projectName}</TableCell>
                                                <TableCell>{row.workerName}</TableCell>
                                                <TableCell>{row.workerRut}</TableCell>
                                            </>
                                        )}
                                        <TableCell>{row.code}</TableCell>
                                        <TableCell>{row.description}</TableCell>
                                        <TableCell className="text-right">{row.quantity}</TableCell>
                                        <TableCell className="text-right">${row.unitCost.toLocaleString(language)}</TableCell>
                                        <TableCell className="text-right">${row.totalCost.toLocaleString(language)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={reportType === 'project' ? 10 : 5} className="text-right font-bold text-lg">{t('total')}</TableCell>
                                    <TableCell className="text-right font-bold text-lg">${totalReportCost.toLocaleString(language)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
