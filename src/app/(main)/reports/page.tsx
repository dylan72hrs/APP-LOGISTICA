'use client';
import { useState, useEffect } from 'react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Download, FileText } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns';
import { useData } from '@/lib/hooks/use-data';
import { useLanguage } from '@/lib/hooks/use-language';
import { es as esLocale, enUS as enLocale, fr as frLocale } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import type { ConsumptionRecord, InventoryItem, Project, Warehouse, Worker } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


type FilterType = 'week' | 'month' | 'year' | 'range';
type ReportType = 'byProject' | 'totalByWarehouse';

const dateLocales = {
  es: esLocale,
  en: enLocale,
  fr: frLocale,
};

interface ProjectReportData {
    type: 'byProject';
    headers: (string | null)[][];
    merges: XLSX.Range[];
    data: (string | number)[][];
    projectsInReport: Project[];
}

interface WarehouseReportData {
    type: 'totalByWarehouse';
    headers: (string | null)[][];
    data: (string | number)[][];
}

type ReportData = ProjectReportData | WarehouseReportData | null;


export default function ReportsPage() {
    const { consumptionRecords, inventory, projects, warehouses, workers } = useData();
    const { t, language } = useLanguage();

    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [filterType, setFilterType] = useState<FilterType>('month');
    const [reportType, setReportType] = useState<ReportType>('byProject');

    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleFilterTypeChange = (type: FilterType) => {
        setFilterType(type);
        const now = new Date();
        let start, end;
        switch (type) {
            case 'week':
                start = startOfWeek(now, { weekStartsOn: 1 });
                end = endOfWeek(now, { weekStartsOn: 1 });
                break;
            case 'month':
                start = startOfMonth(now);
                end = endOfMonth(now);
                break;
            case 'year':
                start = startOfYear(now);
                end = endOfYear(now);
                break;
            case 'range':
                start = startDate;
                end = endDate;
                break;
        }
        setStartDate(start);
        setEndDate(end);
        setReportData(null); 
    };
    
    useEffect(() => {
        handleFilterTypeChange('month');
    }, []);

    const processProjectReportData = (): ProjectReportData | null => {
        if (!startDate || !endDate) return null;

        const filteredConsumptions = consumptionRecords.filter(record => {
            const recordDate = typeof record.date === 'string' ? parseISO(record.date) : record.date;
            return recordDate >= startDate && recordDate <= endDate;
        });

        const projectIdsInReport = [...new Set(filteredConsumptions.map(c => c.projectId))];
        const projectsInReport = projects.filter(p => projectIdsInReport.includes(p.id)).sort((a, b) => a.id.localeCompare(b.id));

        const itemIdsInReport = [...new Set(filteredConsumptions.flatMap(c => c.items.map(i => i.itemId)))];
        const itemsInReport = inventory
            .filter(item => itemIdsInReport.includes(item.id))
            .filter((item, index, self) => 
                index === self.findIndex(t => t.code === item.code)
            )
            .sort((a, b) => a.description.localeCompare(b.description));

        const dataMatrix: Record<string, Record<string, number>> = {}; 

        for (const consumption of filteredConsumptions) {
            for (const consumedItem of consumption.items) {
                const itemCode = inventory.find(i => i.id === consumedItem.itemId)?.code;
                if (!itemCode) continue;

                if (!dataMatrix[itemCode]) {
                    dataMatrix[itemCode] = {};
                }
                const currentQuantity = dataMatrix[itemCode][consumption.projectId] || 0;
                dataMatrix[itemCode][consumption.projectId] = currentQuantity + consumedItem.quantity;
            }
        }
        
        const headers: (string | null)[][] = [];
        const merges: XLSX.Range[] = [];
        
        const formattedStartDate = format(startDate, 'dd-MMMM-yyyy', { locale: dateLocales[language] }).toUpperCase();
        const formattedEndDate = format(endDate, 'dd-MMMM-yyyy', { locale: dateLocales[language] }).toUpperCase();
        
        headers.push([`CONSUMO EPP PERÍODO DEL ${formattedStartDate} AL ${formattedEndDate}`]);
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 + projectsInReport.length * 2 } });
        headers.push([]);

        const projectNamesRow: (string|null)[] = [t('epp_item_description'), null, null, null];
        projectsInReport.forEach(proj => projectNamesRow.push(proj.name, null));
        headers.push(projectNamesRow);
        
        const projectIdsRow: (string|null)[] = [null, null, null, null];
        projectsInReport.forEach(proj => projectIdsRow.push(proj.id, null));
        headers.push(projectIdsRow);
        
        const subHeaderRow = ["Descripción", "Talla", "Cód. AX", "Precio ($)"];
        projectsInReport.forEach(() => subHeaderRow.push("CANT", "VALOR"));
        headers.push(subHeaderRow);

        merges.push({ s: { r: 2, c: 0 }, e: { r: 3, c: 3 } });

        projectsInReport.forEach((_, index) => {
            const startCol = 4 + index * 2;
            merges.push({ s: { r: 2, c: startCol }, e: { r: 2, c: startCol + 1 } }); // Project Name
            merges.push({ s: { r: 3, c: startCol }, e: { r: 3, c: startCol + 1 } }); // Project ID
        });


        const data: (string | number)[][] = [];
        itemsInReport.forEach(item => {
            const row: (string | number)[] = [
                item.description,
                item.size,
                item.code,
                item.cost,
            ];
            projectsInReport.forEach(proj => {
                const quantity = dataMatrix[item.code]?.[proj.id] || 0;
                const value = quantity * item.cost;
                row.push(quantity, value);
            });
            data.push(row);
        });

        return { type: 'byProject', headers, merges, data, projectsInReport };
    }

    const processWarehouseReportData = (): WarehouseReportData | null => {
        if (!startDate || !endDate) return null;
    
        const filteredConsumptions = consumptionRecords.filter(record => {
            const recordDate = typeof record.date === 'string' ? parseISO(record.date) : record.date;
            return recordDate >= startDate && recordDate <= endDate;
        });
    
        const headers = [[t('month'), t('country'), t('warehouse'), t('project_id'), t('project_name'), t('worker'), t('code'), t('description'), t('quantity')]];
        const data: (string | number)[][] = [];

        for (const record of filteredConsumptions) {
            const warehouse = warehouses.find(w => w.id === record.warehouseId);
            const project = projects.find(p => p.id === record.projectId);
            const worker = workers.find(w => w.id === record.workerId);
            const recordDate = typeof record.date === 'string' ? parseISO(record.date) : record.date;

            for (const consumedItem of record.items) {
                const item = inventory.find(i => i.id === consumedItem.itemId);
                
                data.push([
                    format(recordDate, 'MMMM', { locale: dateLocales[language] }),
                    warehouse?.country || 'N/A',
                    warehouse?.name || 'N/A',
                    project?.id || 'N/A',
                    project?.name || 'N/A',
                    worker?.name || 'N/A',
                    item?.code || 'N/A',
                    item?.description || 'N/A',
                    consumedItem.quantity,
                ]);
            }
        }
        
        data.sort((a,b) => String(a[1]).localeCompare(String(b[1])) || String(a[3]).localeCompare(String(b[3])));
    
        return { type: 'totalByWarehouse', headers, data };
    };

    const handleGenerateReport = () => {
        setIsGenerating(true);
        let processedData;
        if (reportType === 'byProject') {
            processedData = processProjectReportData();
        } else {
            processedData = processWarehouseReportData();
        }
        setReportData(processedData);
        setIsGenerating(false);
    }
    
    const handleDownloadReport = () => {
        if (!reportData) return;
        
        let sheetData: (string|number|null)[][];
        const wb = XLSX.utils.book_new();
        const fileName = reportType === 'byProject' 
            ? `Consumo_EPP_por_Proyecto_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
            : `Consumo_Total_por_Bodega_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

        if (reportData.type === 'byProject') {
             sheetData = [
                ...reportData.headers,
                ...reportData.data
            ];
            const ws = XLSX.utils.aoa_to_sheet(sheetData);
            ws['!merges'] = reportData.merges;
            XLSX.utils.book_append_sheet(wb, ws, 'Reporte Proyecto');

        } else { // warehouse report
            sheetData = [...reportData.headers, ...reportData.data];
            const ws = XLSX.utils.aoa_to_sheet(sheetData);
            XLSX.utils.book_append_sheet(wb, ws, 'Reporte Bodega');
        }

        XLSX.writeFile(wb, fileName);
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('reports')}</h1>
                <CardDescription>{t('generate_view_export_reports')}</CardDescription>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>{t('filters')}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-start gap-8">
                        <div className="space-y-2">
                            <Label>{t('date_range')}</Label>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button variant={filterType === 'week' ? 'default' : 'outline'} onClick={() => handleFilterTypeChange('week')}>{t('week')}</Button>
                                <Button variant={filterType === 'month' ? 'default' : 'outline'} onClick={() => handleFilterTypeChange('month')}>{t('month')}</Button>
                                <Button variant={filterType === 'year' ? 'default' : 'outline'} onClick={() => handleFilterTypeChange('year')}>{t('year')}</Button>
                                <Button variant={filterType === 'range' ? 'default' : 'outline'} onClick={() => handleFilterTypeChange('range')}>{t('range')}</Button>
                                
                                {filterType === 'range' && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="date"
                                                variant={"outline"}
                                                className="w-full sm:w-[300px] justify-start text-left font-normal"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {startDate && endDate ? (
                                                    <>
                                                        {format(startDate, "LLL dd, y", { locale: dateLocales[language] })} - {format(endDate, "LLL dd, y", { locale: dateLocales[language] })}
                                                    </>
                                                ) : (
                                                    <span>{t('pick_a_date')}</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={startDate}
                                                selected={{ from: startDate, to: endDate }}
                                                onSelect={(range) => { setStartDate(range?.from); setEndDate(range?.to); setReportData(null); }}
                                                numberOfMonths={2}
                                                locale={dateLocales[language]}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('report_type')}</Label>
                            <RadioGroup value={reportType} onValueChange={(val: any) => { setReportType(val); setReportData(null); }} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="byProject" id="byProject" />
                                    <Label htmlFor="byProject">{t('consumption_by_project')}</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="totalByWarehouse" id="totalByWarehouse" />
                                    <Label htmlFor="totalByWarehouse">{t('total_consumption_by_warehouse')}</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                     <div className="flex gap-2">
                        <Button onClick={handleGenerateReport} disabled={!startDate || !endDate || isGenerating}>
                            {t('generate_report')}
                        </Button>
                        <Button onClick={handleDownloadReport} disabled={!reportData}>
                            <Download className="mr-2" />
                            {t('download_xlsx')}
                        </Button>
                     </div>
                </CardContent>
            </Card>

            {reportData?.type === 'byProject' ? (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('report_preview')}</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table className="border">
                           <TableHeader>
                                <TableRow>
                                    <TableHead className="border text-center font-bold bg-muted/50 p-2" colSpan={4} rowSpan={2}>{t('epp_item_description')}</TableHead>
                                    {reportData.projectsInReport.map((proj, index) => (
                                        <TableHead key={`proj-h-${index}`} className="border text-center font-bold bg-muted/50 p-2" colSpan={2}>{proj.name}</TableHead>
                                    ))}
                                </TableRow>
                                <TableRow>
                                     {reportData.projectsInReport.map((proj, index) => (
                                        <TableHead key={`proj-id-h-${index}`} className="border text-center font-bold bg-muted/50 p-2" colSpan={2}>{proj.id}</TableHead>
                                    ))}
                                </TableRow>
                                 <TableRow>
                                     <TableHead className="border font-bold bg-muted/50 p-2">Descripción</TableHead>
                                    <TableHead className="border font-bold bg-muted/50 p-2">Talla</TableHead>
                                    <TableHead className="border font-bold bg-muted/50 p-2">Cód. AX</TableHead>
                                    <TableHead className="border font-bold bg-muted/50 p-2">Precio ($)</TableHead>
                                    {reportData.projectsInReport.map((_, index) => (
                                        <React.Fragment key={`sub-h-${index}`}>
                                            <TableHead className="border text-center font-bold bg-muted/50 p-2">CANT</TableHead>
                                            <TableHead className="border text-center font-bold bg-muted/50 p-2">VALOR</TableHead>
                                        </React.Fragment>
                                    ))}
                                </TableRow>
                           </TableHeader>
                           <TableBody>
                                {reportData.data.map((row, rowIndex) => (
                                    <TableRow key={`data-${rowIndex}`}>
                                        {row.map((cell, cellIndex) => (
                                            <TableCell key={`data-${rowIndex}-${cellIndex}`} className={`border p-2 ${cellIndex >= 3 ? 'text-right' : ''}`}>
                                                {typeof cell === 'number' ? cell.toLocaleString(language) : cell}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                           </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : reportData?.type === 'totalByWarehouse' ? (
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('report_preview')}</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table className="border">
                           <TableHeader>
                                <TableRow>
                                    {reportData.headers[0].map((header, index) => (
                                        <TableHead key={index} className="border text-left font-bold bg-muted/50 p-2">{header}</TableHead>
                                    ))}
                                </TableRow>
                           </TableHeader>
                           <TableBody>
                                {reportData.data.map((row, rowIndex) => (
                                    <TableRow key={`data-${rowIndex}`}>
                                        {row.map((cell, cellIndex) => (
                                            <TableCell key={`data-${rowIndex}-${cellIndex}`} className={`border p-2 ${cellIndex > 7 ? 'text-right' : ''}`}>
                                                {typeof cell === 'number' ? cell.toLocaleString(language) : String(cell)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                           </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center">
                            <FileText className="h-16 w-16 text-muted-foreground/50" />
                            <p className="mt-4 text-lg font-semibold text-muted-foreground">{t('select_dates_and_generate')}</p>
                            <p className="mt-2 text-sm text-muted-foreground/80">{t('report_will_be_displayed_here')}</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
