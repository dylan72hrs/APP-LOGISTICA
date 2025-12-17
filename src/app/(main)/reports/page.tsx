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


type FilterType = 'week' | 'month' | 'year' | 'range';

const dateLocales = {
  es: esLocale,
  en: enLocale,
  fr: frLocale,
};

export default function ReportsPage() {
    const { consumptionRecords, inventory, projects } = useData();
    const { t, language } = useLanguage();

    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [filterType, setFilterType] = useState<FilterType>('month');

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
    };

    useEffect(() => {
        handleFilterTypeChange('month');
    }, []);

    const handleGenerateReport = () => {
        if (!startDate || !endDate) return;

        // 1. Filter consumptions by date
        const filteredConsumptions = consumptionRecords.filter(record => {
            const recordDate = typeof record.date === 'string' ? parseISO(record.date) : record.date;
            return recordDate >= startDate && recordDate <= endDate;
        });

        // 2. Get unique projects from filtered consumptions
        const projectIdsInReport = [...new Set(filteredConsumptions.map(c => c.projectId))];
        const projectsInReport = projects.filter(p => projectIdsInReport.includes(p.id)).sort((a, b) => a.id.localeCompare(b.id));


        // 3. Get unique items from filtered consumptions
        const itemIdsInReport = [...new Set(filteredConsumptions.flatMap(c => c.items.map(i => i.itemId)))];
        const itemsInReport = inventory
            .filter(item => itemIdsInReport.includes(item.id))
            // Get unique items by code, description, size
            .filter((item, index, self) => 
                index === self.findIndex(t => (
                    t.code === item.code && t.description === item.description && t.size === item.size
                ))
            )
            .sort((a, b) => a.description.localeCompare(b.description));


        // 4. Create the data matrix
        const dataMatrix: Record<string, Record<string, number>> = {}; // { itemId: { projectId: quantity, ... }, ... }

        for (const consumption of filteredConsumptions) {
            for (const consumedItem of consumption.items) {
                if (!dataMatrix[consumedItem.itemId]) {
                    dataMatrix[consumedItem.itemId] = {};
                }
                const currentQuantity = dataMatrix[consumedItem.itemId][consumption.projectId] || 0;
                dataMatrix[consumedItem.itemId][consumption.projectId] = currentQuantity + consumedItem.quantity;
            }
        }
        
        // 5. Build the Excel sheet data
        const sheetData: (string | number)[][] = [];
        const merges = [];

        // --- HEADER ---

        // Row 1: Title
        const formattedStartDate = format(startDate, 'dd-MMMM-yyyy', { locale: dateLocales[language] }).toUpperCase();
        const formattedEndDate = format(endDate, 'dd-MMMM-yyyy', { locale: dateLocales[language] }).toUpperCase();
        sheetData.push([`CONSUMO EPP PERÍODO DEL ${formattedStartDate} AL ${formattedEndDate}`]);
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 + projectsInReport.length * 2 } });
        
        // Row 2: Spacer
        sheetData.push([]); 

        // Row 3: "Elemento Protección Personal" and Project Names
        const headerRow3: (string | null)[] = ["Elemento Protección Personal", null, null, null];
        projectsInReport.forEach(proj => {
            headerRow3.push(proj.name, null);
        });
        sheetData.push(headerRow3);
        merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }); // Merge "Elemento..."
        projectsInReport.forEach((_, index) => {
            const col = 4 + index * 2;
            merges.push({ s: { r: 2, c: col }, e: { r: 2, c: col + 1 } });
        });

        // Row 4: Project IDs
        const headerRow4: (string | null)[] = [null, null, null, null];
        projectsInReport.forEach(proj => {
            headerRow4.push(proj.id, null);
        });
        sheetData.push(headerRow4);
        projectsInReport.forEach((_, index) => {
            const col = 4 + index * 2;
            merges.push({ s: { r: 3, c: col }, e: { r: 3, c: col + 1 } });
        });
        
        // Row 5: Column Headers ("Descripción", "CANT", "VALOR", etc.)
        const headerRow5: (string | number)[] = ["Descripción", "Talla", "Cód. AX", "Precio ($)"];
        projectsInReport.forEach(proj => {
            headerRow5.push("CANT", "VALOR");
        });
        sheetData.push(headerRow5);

        // --- DATA ROWS ---
        itemsInReport.forEach(item => {
            const row: (string | number)[] = [
                item.description,
                item.size,
                item.code,
                item.cost,
            ];

            projectsInReport.forEach(proj => {
                const quantity = dataMatrix[item.id]?.[proj.id] || 0;
                const value = quantity * item.cost;
                row.push(quantity, value);
            });
            sheetData.push(row);
        });
        
        // 6. Create and download workbook
        const ws = XLSX.utils.aoa_to_sheet(sheetData, {cellDates: true});
        
        ws['!merges'] = merges;
        
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
                                            onSelect={(range) => { setStartDate(range?.from); setEndDate(range?.to); }}
                                            numberOfMonths={2}
                                            locale={dateLocales[language]}
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </div>
                     <Button onClick={handleGenerateReport} disabled={!startDate || !endDate}>
                        <Download className="mr-2" />
                        {t('generate_and_download_xlsx')}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center">
                        <FileText className="h-16 w-16 text-muted-foreground/50" />
                        <p className="mt-4 text-lg font-semibold text-muted-foreground">{t('select_dates_and_generate')}</p>
                        <p className="mt-2 text-sm text-muted-foreground/80">{t('report_will_be_downloaded_automatically')}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
