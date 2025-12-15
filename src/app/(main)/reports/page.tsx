'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from '@/components/ui/table';
import { mockConsumptionRecords, mockWorkers, mockProjects, mockInventory } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/hooks/use-language';
import * as XLSX from 'xlsx';

type ReportType = 'worker' | 'project';

interface ReportRow {
    date: string;
    code: string;
    description: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
}

export default function ReportsPage() {
    const { t, language } = useLanguage();
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(),
    });
    const [reportType, setReportType] = useState<ReportType>('worker');
    const [selectedId, setSelectedId] = useState<string>('');
    const [reportData, setReportData] = useState<ReportRow[]>([]);
    const [reportTitle, setReportTitle] = useState('');

    const handleGenerateReport = () => {
        if (!date?.from || !date?.to || !selectedId) {
            setReportData([]);
            return;
        }

        const filteredRecords = mockConsumptionRecords.filter(record => {
            const recordDate = record.date;
            const isInDateRange = recordDate >= date.from! && recordDate <= date.to!;
            
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
            record.items.forEach(consumedItem => {
                const inventoryItem = mockInventory.find(inv => inv.id === consumedItem.itemId);
                if (inventoryItem) {
                    generatedData.push({
                        date: record.date.toLocaleDateString(language),
                        code: inventoryItem.code,
                        description: inventoryItem.description,
                        quantity: consumedItem.quantity,
                        unitCost: inventoryItem.cost,
                        totalCost: consumedItem.quantity * inventoryItem.cost,
                    });
                }
            });
        });

        setReportData(generatedData);
        
        let title = `${t('consumption_report_for')} `;
        if (reportType === 'worker') {
            title += mockWorkers.find(w => w.id === selectedId)?.name;
        } else {
            title += mockProjects.find(p => p.id === selectedId)?.name;
        }
        title += ` (${format(date.from, 'LLL dd, y')} - ${format(date.to, 'LLL dd, y')})`;
        setReportTitle(title);
    };

    const totalReportCost = useMemo(() => {
        return reportData.reduce((acc, row) => acc + row.totalCost, 0);
    }, [reportData]);

    const handleExportExcel = () => {
        if (reportData.length === 0) return;

        const headers = [t('date'), t('code'), t('description'), t('quantity'), t('unit_cost'), t('total_cost')];
        const dataToExport = reportData.map(row => [
            row.date,
            row.code,
            row.description,
            row.quantity,
            row.unitCost,
            row.totalCost,
        ]);
        
        const ws = XLSX.utils.aoa_to_sheet([headers, ...dataToExport]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Consumos");
        XLSX.writeFile(wb, "reporte_consumos.xlsx");
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
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                    <div className="space-y-2">
                        <Label>{t('date_range')}</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                    date.to ? (
                                        <>
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                    ) : (
                                    <span>{t('pick_a_date')}</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                            />
                            </PopoverContent>
                        </Popover>
                    </div>

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
                         <Select value={selectedId} onValueChange={setSelectedId}>
                            <SelectTrigger id="select-entity" className='w-full'>
                                <SelectValue placeholder={reportType === 'worker' ? t('select_a_worker') : t('select_a_project')} />
                            </SelectTrigger>
                            <SelectContent>
                                {reportType === 'worker' 
                                 ? mockWorkers.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)
                                 : mockProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                                }
                            </SelectContent>
                         </Select>
                    </div>

                    <Button onClick={handleGenerateReport} className="w-full">{t('generate_report')}</Button>
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
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('date')}</TableHead>
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
                                    <TableCell colSpan={5} className="text-right font-bold text-lg">{t('total')}</TableCell>
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
