'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Search, Printer, FileSignature } from 'lucide-react';
import { add, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns';
import { ReporteTrabajador, type WorkerReportData } from '@/components/reporte-trabajador';
import { useData } from '@/lib/hooks/use-data';
import { useLanguage } from '@/lib/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import type { Worker, ConsumptionRecord, InventoryItem } from '@/lib/types';
import { es as esLocale, enUS as enLocale, fr as frLocale } from 'date-fns/locale';

type FilterType = 'week' | 'month' | 'year' | 'range';

const dateLocales = {
  es: esLocale,
  en: enLocale,
  fr: frLocale,
};

export default function ConsumptionSheetPage() {
  const { workers, consumptionRecords, inventory, projects } = useData();
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [workerRutInput, setWorkerRutInput] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [filterType, setFilterType] = useState<FilterType>('month');

  const [reportData, setReportData] = useState<WorkerReportData | null>(null);

  const handleWorkerSearch = () => {
    const foundWorker = workers.find(w => w.rut.replace(/[.-]/g, '') === workerRutInput.replace(/[.-]/g, ''));
    if (foundWorker) {
      setSelectedWorker(foundWorker);
      toast({
        title: t('worker_found'),
        description: `${t('showing_results_for')} ${foundWorker.name}`,
      });
      // Trigger report generation for the found worker with the current dates
      if (startDate && endDate) {
        generateReport(foundWorker, startDate, endDate);
      }
    } else {
      setSelectedWorker(null);
      setReportData(null);
      toast({ variant: 'destructive', title: t('error'), description: t('worker_not_found') });
    }
  };

  const handleFilterTypeChange = (type: FilterType) => {
    setFilterType(type);
    const now = new Date();
    switch (type) {
      case 'week':
        setStartDate(startOfWeek(now, { weekStartsOn: 1 }));
        setEndDate(endOfWeek(now, { weekStartsOn: 1 }));
        break;
      case 'month':
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case 'year':
        setStartDate(startOfYear(now));
        setEndDate(endOfYear(now));
        break;
      case 'range':
        // Keep existing dates
        break;
    }
  };
  
  // Initialize dates on component mount
  useEffect(() => {
    handleFilterTypeChange('month');
  }, []);

  // Auto-generate report when dates change
  useEffect(() => {
    if (selectedWorker && startDate && endDate) {
        generateReport(selectedWorker, startDate, endDate);
    }
  }, [selectedWorker, startDate, endDate]);


  const generateReport = (worker: Worker, start: Date, end: Date) => {
    const workerConsumptions = consumptionRecords.filter(record => {
      const recordDate = typeof record.date === 'string' ? parseISO(record.date) : record.date;
      return record.workerId === worker.id && recordDate >= start && recordDate <= end;
    });

    if (workerConsumptions.length === 0) {
      toast({
        variant: 'destructive',
        title: t('no_results_found'),
        description: t('no_consumptions_in_period'),
      });
      setReportData(null); // Clear previous report data
      return;
    }

    const consumedItems = workerConsumptions.flatMap(record => {
      // ETAPA 4.7K: la ficha muestra el proyecto del consumo. Usa el snapshot del
      // registro y cae al maestro de proyectos para datos historicos sin snapshot.
      const project = record.projectId ? projects.find(p => p.id === record.projectId) : undefined;
      const projectCode = record.projectCode || project?.projectCode || record.projectId || '';
      const projectName = record.projectName || project?.name || '';
      const costCenter = record.costCenter || project?.costCenter || '';
      const financialDimension = record.financialDimension || project?.financialDimension || '';

      return record.items.map(item => {
        const inventoryItem = inventory.find(inv => inv.id === item.itemId);
        return {
          date: typeof record.date === 'string' ? parseISO(record.date) : record.date,
          code: inventoryItem?.code || 'N/A',
          description: inventoryItem?.description || 'N/A',
          quantity: item.quantity,
          projectLabel: projectCode ? (projectName ? `${projectCode} · ${projectName}` : projectCode) : 'Sin proyecto',
          costCenter: costCenter || 'N/A',
          financialDimension: financialDimension || 'N/A',
        };
      });
    }).sort((a, b) => a.date.getTime() - b.date.getTime());

    const totalItemsConsumed = consumedItems.reduce((acc, item) => acc + item.quantity, 0);

    setReportData({
      id: `FCT-${worker.rut}-${Date.now()}`,
      generationDate: new Date(),
      startDate: start,
      endDate: end,
      worker,
      items: consumedItems,
      totalItemsConsumed,
    });
  };

  const handlePrint = () => {
    if (!reportData) return;
    window.print();
  };

  return (
    <>
    <div className="flex flex-col gap-4 print:hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('consumption_sheet')}</h1>
          <CardDescription>{t('search_worker_by_rut')}</CardDescription>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('filters')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
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
        </CardContent>
      </Card>
      
      {selectedWorker && reportData ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>{t('report_results')}</CardTitle>
                <CardDescription>{`${t('showing_results_for')} ${selectedWorker.name}`}</CardDescription>
            </div>
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4"/>
                {t('print_report')}
            </Button>
          </CardHeader>
          <CardContent>
             <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('date')}</TableHead>
                            <TableHead>{t('code')}</TableHead>
                            <TableHead>{t('description')}</TableHead>
                            <TableHead>{t('project')}</TableHead>
                            <TableHead>{t('cost_center')} / {t('financial_dimension')}</TableHead>
                            <TableHead className='text-right'>{t('quantity')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.items.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.date.toLocaleDateString(language)}</TableCell>
                                <TableCell>{item.code}</TableCell>
                                <TableCell>{item.description}</TableCell>
                                <TableCell>{item.projectLabel}</TableCell>
                                <TableCell>{item.costCenter} / {item.financialDimension}</TableCell>
                                <TableCell className='text-right'>{item.quantity}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </div>
             <div className="flex justify-end mt-4">
                <p className="text-lg font-bold">{t('total_items_consumed')}: {reportData.totalItemsConsumed}</p>
             </div>
          </CardContent>
        </Card>
      ) : selectedWorker ? (
         <Card>
            <CardContent className="pt-6">
                 <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center">
                    <FileSignature className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-semibold text-muted-foreground">{t('no_consumptions_in_period')}</p>
                    <p className="mt-2 text-sm text-muted-foreground/80">{`${t('showing_results_for')} ${selectedWorker.name}`}</p>
                </div>
            </CardContent>
         </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center">
                <FileSignature className="h-16 w-16 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-semibold text-muted-foreground">{t('generate_report_to_see_results')}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    {reportData && (
      <div className="hidden bg-white text-black print:block">
        <ReporteTrabajador data={reportData} />
      </div>
    )}
    </>
  );
}
