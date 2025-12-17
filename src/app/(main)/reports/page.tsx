'use client';
import { useState, useEffect } from 'react';
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
import type { ConsumptionRecord, InventoryItem, Project } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


type FilterType = 'week' | 'month' | 'year' | 'range';

const dateLocales = {
  es: esLocale,
  en: enLocale,
  fr: frLocale,
};

interface ReportData {
  headers: (string | null)[][];
  merges: XLSX.Range[];
  data: (string | number)[][];
  projectsInReport: Project[];
}

export default function ReportsPage() {
    const { consumptionRecords, inventory, projects } = useData();
    const { t, language } = useLanguage();

    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [filterType, setFilterType] = useState<FilterType>('month');

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
                start = startDate; // Keep existing if switching to range
                end = endDate;
                break;
        }
        setStartDate(start);
        setEndDate(end);
        setReportData(null); // Reset preview on date change
    };

    useEffect(() => {
        handleFilterTypeChange('month');
    }, []);

    const processReportData = (): ReportData | null => {
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
        
        // Row 1: Title
        const titleRow = [`CONSUMO EPP PERÍODO DEL ${formattedStartDate} AL ${formattedEndDate}`];
        headers.push(titleRow);
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 + projectsInReport.length * 2 } });
        
        // Row 2: Empty
        headers.push([]);

        // Row 3: "Elemento Protección Personal" and Project Names
        const headerRow3 = ["Elemento Protección Personal", null, null, null];
        projectsInReport.forEach(proj => {
            headerRow3.push(proj.name, null);
        });
        headers.push(headerRow3);
        merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 3 } });
        projectsInReport.forEach((_, index) => {
            merges.push({ s: { r: 2, c: 4 + index * 2 }, e: { r: 2, c: 5 + index * 2 } });
        });

        // Row 4: Project IDs
        const headerRow4 = [null, null, null, null];
        projectsInReport.forEach(proj => {
            headerRow4.push(proj.id, null);
        });
        headers.push(headerRow4);
        projectsInReport.forEach((_, index) => {
            merges.push({ s: { r: 3, c: 4 + index * 2 }, e: { r: 3, c: 5 + index * 2 } });
        });

        // Row 5: Column details
        const headerRow5 = ["Descripción", "Talla", "Cód. AX", "Precio ($)"];
        projectsInReport.forEach(() => {
            headerRow5.push("CANT", "VALOR");
        });
        headers.push(headerRow5);

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

        return { headers, merges, data, projectsInReport };
    }

    const handleGenerateReport = () => {
        setIsGenerating(true);
        const processedData = processReportData();
        setReportData(processedData);
        setIsGenerating(false);
    }
    
    const handleDownloadReport = () => {
        if (!reportData) return;
        
        const sheetData = [...reportData.headers, ...reportData.data];
        const ws = XLSX.utils.aoa_to_sheet(sheetData, {cellDates: true});
        ws['!merges'] = reportData.merges;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Consumo_Proyectos');
        XLSX.writeFile(wb, `Consumo_EPP_por_Proyecto_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
                <CardContent className="flex flex-wrap items-center gap-6">
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

            {reportData ? (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('report_preview')}</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table className="border">
                           <TableHeader>
                                {reportData.headers.map((row, rowIndex) => (
                                    <TableRow key={`header-${rowIndex}`}>
                                        {row.map((cell, cellIndex) => {
                                            if(cell === null) return null; // Skip rendering for null placeholders used in merges
                                            const merge = reportData.merges.find(m => m.s.r === rowIndex && m.s.c === cellIndex);
                                            const colSpan = merge ? merge.e.c - merge.s.c + 1 : 1;
                                            return (
                                                <TableHead 
                                                    key={`header-${rowIndex}-${cellIndex}`} 
                                                    colSpan={colSpan}
                                                    className="border text-center font-bold bg-muted/50"
                                                >
                                                    {cell}
                                                </TableHead>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                           </TableHeader>
                           <TableBody>
                                {reportData.data.map((row, rowIndex) => (
                                    <TableRow key={`data-${rowIndex}`}>
                                        {row.map((cell, cellIndex) => (
                                            <TableCell key={`data-${rowIndex}-${cellIndex}`} className={`border ${cellIndex >= 4 ? 'text-right' : ''}`}>
                                                {typeof cell === 'number' ? cell.toLocaleString(language) : cell}
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
