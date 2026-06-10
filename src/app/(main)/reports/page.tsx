'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar as CalendarIcon, Download, FileText } from 'lucide-react';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { es as esLocale, enUS as enLocale, fr as frLocale } from 'date-fns/locale';
import { useData } from '@/lib/hooks/use-data';
import { useLanguage } from '@/lib/hooks/use-language';
import { sanitizeExcelRow } from '@/lib/excel-security';

type FilterType = 'week' | 'month' | 'year' | 'range';
type ReportType = 'warehouse' | 'worker' | 'product' | 'period';
type ReportCell = string | number | null;

interface ReportLine {
  recordId: string;
  date: Date;
  dateKey: string;
  dateLabel: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCountry: string;
  workerId: string;
  workerRut: string;
  workerName: string;
  workerPosition: string;
  workerDepartment: string;
  itemKey: string;
  itemCode: string;
  itemDescription: string;
  itemSize: string;
  quantity: number;
  requesterReference: string;
}

interface ReportSummary {
  title: string;
  description: string;
  headers: string[];
  rows: ReportCell[][];
}

interface AggregateBucket {
  label: string;
  country?: string;
  rut?: string;
  position?: string;
  department?: string;
  size?: string;
  quantity: number;
  records: Set<string>;
  workers: Set<string>;
  warehouses: Set<string>;
  products: Set<string>;
  references: Set<string>;
}

const dateLocales = {
  es: esLocale,
  en: enLocale,
  fr: frLocale,
};

const reportTypeLabels: Record<ReportType, string> = {
  warehouse: 'Reporte por bodega',
  worker: 'Reporte por trabajador',
  product: 'Reporte por EPP/producto',
  period: 'Reporte por fecha/periodo',
};

const emptyValue = 'N/A';

function toDate(value: Date | string) {
  return typeof value === 'string' ? parseISO(value) : value;
}

function addReference(bucket: AggregateBucket, reference: string) {
  if (reference) bucket.references.add(reference);
}

function formatReferenceList(references: Set<string>) {
  return references.size > 0 ? Array.from(references).join(' | ') : 'Sin referencia';
}

function createBucket(label: string): AggregateBucket {
  return {
    label,
    quantity: 0,
    records: new Set(),
    workers: new Set(),
    warehouses: new Set(),
    products: new Set(),
    references: new Set(),
  };
}

function sortRowsByLabel(rows: ReportCell[][]) {
  return rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
}

export default function ReportsPage() {
  const { consumptionRecords, inventory, warehouses, workers } = useData();
  const { language } = useLanguage();

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [reportType, setReportType] = useState<ReportType>('warehouse');

  useEffect(() => {
    const now = new Date();
    setStartDate(startOfMonth(now));
    setEndDate(endOfMonth(now));
  }, []);

  const periodLabel = useMemo(() => {
    if (!startDate || !endDate) return 'Periodo no definido';
    return `${format(startDate, 'dd-MM-yyyy')} al ${format(endDate, 'dd-MM-yyyy')}`;
  }, [startDate, endDate]);

  const inventoryLookup = useMemo(() => {
    const byWarehouseAndId = new Map<string, (typeof inventory)[number]>();
    const byId = new Map<string, (typeof inventory)[number]>();

    inventory.forEach(item => {
      byWarehouseAndId.set(`${item.warehouseId}:${item.id}`, item);
      if (!byId.has(item.id)) byId.set(item.id, item);
    });

    return { byWarehouseAndId, byId };
  }, [inventory]);

  const reportLines = useMemo<ReportLine[]>(() => {
    if (!startDate || !endDate) return [];

    const rangeStart = startOfDay(startDate);
    const rangeEnd = endOfDay(endDate);

    return consumptionRecords
      .filter(record => {
        const recordDate = toDate(record.date);
        return recordDate >= rangeStart && recordDate <= rangeEnd;
      })
      .flatMap(record => {
        const recordDate = toDate(record.date);
        const warehouse = warehouses.find(item => item.id === record.warehouseId);
        const worker = workers.find(item => item.id === record.workerId);

        return record.items.map(consumedItem => {
          const inventoryItem =
            inventoryLookup.byWarehouseAndId.get(`${record.warehouseId}:${consumedItem.itemId}`) ||
            inventoryLookup.byId.get(consumedItem.itemId);

          const itemCode = inventoryItem?.code || consumedItem.itemId;
          const itemDescription = inventoryItem?.description || emptyValue;
          const itemSize = inventoryItem?.size || emptyValue;

          return {
            recordId: record.id,
            date: recordDate,
            dateKey: format(recordDate, 'yyyy-MM-dd'),
            dateLabel: format(recordDate, 'dd-MM-yyyy HH:mm'),
            warehouseId: record.warehouseId,
            warehouseName: warehouse?.name || emptyValue,
            warehouseCountry: warehouse?.country || emptyValue,
            workerId: record.workerId,
            workerRut: worker?.rut || emptyValue,
            workerName: worker?.name || emptyValue,
            workerPosition: worker?.position || emptyValue,
            workerDepartment: worker?.department || emptyValue,
            itemKey: `${itemCode}|${itemDescription}|${itemSize}`,
            itemCode,
            itemDescription,
            itemSize,
            quantity: consumedItem.quantity,
            requesterReference: record.requesterReference?.trim() || '',
          };
        });
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [consumptionRecords, endDate, inventoryLookup, startDate, warehouses, workers]);

  const metrics = useMemo(() => {
    return {
      totalRecords: new Set(reportLines.map(line => line.recordId)).size,
      totalQuantity: reportLines.reduce((sum, line) => sum + line.quantity, 0),
      totalWorkers: new Set(reportLines.map(line => line.workerId)).size,
      totalProducts: new Set(reportLines.map(line => line.itemKey)).size,
      totalWarehouses: new Set(reportLines.map(line => line.warehouseId)).size,
    };
  }, [reportLines]);

  const reportSummary = useMemo<ReportSummary>(() => {
    if (reportType === 'warehouse') {
      const buckets = new Map<string, AggregateBucket>();

      reportLines.forEach(line => {
        const bucket = buckets.get(line.warehouseId) || createBucket(line.warehouseName);
        bucket.country = line.warehouseCountry;
        bucket.quantity += line.quantity;
        bucket.records.add(line.recordId);
        bucket.workers.add(line.workerId);
        bucket.products.add(line.itemKey);
        addReference(bucket, line.requesterReference);
        buckets.set(line.warehouseId, bucket);
      });

      return {
        title: 'Consumo por bodega',
        description: 'Agrupa consumo operativo por bodega activa, sin dimension financiera.',
        headers: ['Bodega', 'Pais', 'Vales', 'Trabajadores', 'EPP distintos', 'Cantidad total', 'Referencia opcional'],
        rows: sortRowsByLabel(Array.from(buckets.values()).map(bucket => [
          bucket.label,
          bucket.country || emptyValue,
          bucket.records.size,
          bucket.workers.size,
          bucket.products.size,
          bucket.quantity,
          formatReferenceList(bucket.references),
        ])),
      };
    }

    if (reportType === 'worker') {
      const buckets = new Map<string, AggregateBucket>();

      reportLines.forEach(line => {
        const bucket = buckets.get(line.workerId) || createBucket(line.workerName);
        bucket.rut = line.workerRut;
        bucket.position = line.workerPosition;
        bucket.department = line.workerDepartment;
        bucket.quantity += line.quantity;
        bucket.records.add(line.recordId);
        bucket.warehouses.add(line.warehouseId);
        bucket.products.add(line.itemKey);
        addReference(bucket, line.requesterReference);
        buckets.set(line.workerId, bucket);
      });

      return {
        title: 'Consumo por trabajador',
        description: 'Agrupa EPP entregado a cada trabajador/invitado del periodo.',
        headers: ['Trabajador', 'Identificador', 'Cargo', 'Departamento', 'Bodegas', 'EPP distintos', 'Cantidad total', 'Referencia opcional'],
        rows: sortRowsByLabel(Array.from(buckets.values()).map(bucket => [
          bucket.label,
          bucket.rut || emptyValue,
          bucket.position || emptyValue,
          bucket.department || emptyValue,
          bucket.warehouses.size,
          bucket.products.size,
          bucket.quantity,
          formatReferenceList(bucket.references),
        ])),
      };
    }

    if (reportType === 'product') {
      const buckets = new Map<string, AggregateBucket>();

      reportLines.forEach(line => {
        const bucket = buckets.get(line.itemKey) || createBucket(line.itemCode);
        bucket.size = line.itemSize;
        bucket.country = line.itemDescription;
        bucket.quantity += line.quantity;
        bucket.records.add(line.recordId);
        bucket.workers.add(line.workerId);
        bucket.warehouses.add(line.warehouseId);
        addReference(bucket, line.requesterReference);
        buckets.set(line.itemKey, bucket);
      });

      return {
        title: 'Consumo por EPP/producto',
        description: 'Agrupa cantidades entregadas por SKU/producto, sin valores monetarios.',
        headers: ['Codigo/SKU', 'Producto', 'Unidad/Talla', 'Bodegas', 'Trabajadores', 'Vales', 'Cantidad total', 'Referencia opcional'],
        rows: sortRowsByLabel(Array.from(buckets.values()).map(bucket => [
          bucket.label,
          bucket.country || emptyValue,
          bucket.size || emptyValue,
          bucket.warehouses.size,
          bucket.workers.size,
          bucket.records.size,
          bucket.quantity,
          formatReferenceList(bucket.references),
        ])),
      };
    }

    const buckets = new Map<string, AggregateBucket>();

    reportLines.forEach(line => {
      const bucket = buckets.get(line.dateKey) || createBucket(format(line.date, 'dd-MM-yyyy'));
      bucket.quantity += line.quantity;
      bucket.records.add(line.recordId);
      bucket.workers.add(line.workerId);
      bucket.warehouses.add(line.warehouseId);
      bucket.products.add(line.itemKey);
      addReference(bucket, line.requesterReference);
      buckets.set(line.dateKey, bucket);
    });

    return {
      title: 'Consumo por fecha/periodo',
      description: 'Resume entregas por fecha dentro del periodo seleccionado.',
      headers: ['Fecha', 'Vales', 'Bodegas', 'Trabajadores', 'EPP distintos', 'Cantidad total', 'Referencia opcional'],
      rows: sortRowsByLabel(Array.from(buckets.values()).map(bucket => [
        bucket.label,
        bucket.records.size,
        bucket.warehouses.size,
        bucket.workers.size,
        bucket.products.size,
        bucket.quantity,
        formatReferenceList(bucket.references),
      ])),
    };
  }, [reportLines, reportType]);

  const detailHeaders = [
    'Vale',
    'Fecha y hora',
    'Bodega',
    'Trabajador',
    'Identificador',
    'Codigo/SKU',
    'Producto',
    'Unidad/Talla',
    'Cantidad',
    'Referencia opcional',
  ];

  const detailRows = useMemo<ReportCell[][]>(() => {
    return reportLines.map(line => [
      line.recordId,
      line.dateLabel,
      line.warehouseName,
      line.workerName,
      line.workerRut,
      line.itemCode,
      line.itemDescription,
      line.itemSize,
      line.quantity,
      line.requesterReference || 'Sin referencia',
    ]);
  }, [reportLines]);

  const handleFilterTypeChange = (type: FilterType) => {
    setFilterType(type);
    const now = new Date();

    if (type === 'week') {
      setStartDate(startOfWeek(now, { weekStartsOn: 1 }));
      setEndDate(endOfWeek(now, { weekStartsOn: 1 }));
      return;
    }

    if (type === 'month') {
      setStartDate(startOfMonth(now));
      setEndDate(endOfMonth(now));
      return;
    }

    if (type === 'year') {
      setStartDate(startOfYear(now));
      setEndDate(endOfYear(now));
    }
  };

  const handleDownloadReport = async () => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    const sheetData: ReportCell[][] = [
      ['Reporte operativo de consumo EPP'],
      ['Periodo', periodLabel],
      ['Vista', reportTypeLabels[reportType]],
      [],
      reportSummary.headers,
      ...reportSummary.rows,
      [],
      ['Detalle operativo'],
      detailHeaders,
      ...detailRows,
    ];

    const sanitizedSheetData = sheetData.map(row => sanitizeExcelRow(row));
    const worksheet = XLSX.utils.aoa_to_sheet(sanitizedSheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte operativo');
    XLSX.writeFile(workbook, `reporte_operativo_epp_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes operativos</h1>
        <CardDescription>
          Consumo de EPP por bodega, trabajador, producto y periodo para control operativo de bodega.
        </CardDescription>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start gap-8">
            <div className="space-y-2">
              <Label>Periodo</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant={filterType === 'week' ? 'default' : 'outline'} onClick={() => handleFilterTypeChange('week')}>
                  Semana
                </Button>
                <Button variant={filterType === 'month' ? 'default' : 'outline'} onClick={() => handleFilterTypeChange('month')}>
                  Mes
                </Button>
                <Button variant={filterType === 'year' ? 'default' : 'outline'} onClick={() => handleFilterTypeChange('year')}>
                  Ano
                </Button>
                <Button variant={filterType === 'range' ? 'default' : 'outline'} onClick={() => setFilterType('range')}>
                  Rango
                </Button>

                {filterType === 'range' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant="outline"
                        className="w-full justify-start text-left font-normal sm:w-[300px]"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate && endDate ? periodLabel : <span>Selecciona fechas</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={startDate}
                        selected={{ from: startDate, to: endDate }}
                        onSelect={(range) => {
                          setStartDate(range?.from);
                          setEndDate(range?.to);
                        }}
                        numberOfMonths={2}
                        locale={dateLocales[language]}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de reporte</Label>
              <RadioGroup
                value={reportType}
                onValueChange={(value) => setReportType(value as ReportType)}
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
              >
                {Object.entries(reportTypeLabels).map(([value, label]) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={value} />
                    <Label htmlFor={value}>{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleDownloadReport} disabled={!startDate || !endDate || reportLines.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel operativo
            </Button>
            <span className="text-sm text-muted-foreground">Periodo actual: {periodLabel}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Vales" value={metrics.totalRecords} />
        <MetricCard title="Cantidad EPP" value={metrics.totalQuantity} />
        <MetricCard title="Trabajadores" value={metrics.totalWorkers} />
        <MetricCard title="Productos" value={metrics.totalProducts} />
        <MetricCard title="Bodegas" value={metrics.totalWarehouses} />
      </div>

      {reportLines.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{reportSummary.title}</CardTitle>
              <CardDescription>{reportSummary.description}</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="border">
                <TableHeader>
                  <TableRow>
                    {reportSummary.headers.map(header => (
                      <TableHead key={header} className="border bg-muted/50 p-2 font-bold">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportSummary.rows.map((row, rowIndex) => (
                    <TableRow key={`summary-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <TableCell
                          key={`summary-${rowIndex}-${cellIndex}`}
                          className={`border p-2 ${typeof cell === 'number' ? 'text-right tabular-nums' : ''}`}
                        >
                          {typeof cell === 'number' ? cell.toLocaleString(language) : cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalle operativo exportable</CardTitle>
              <CardDescription>
                Incluye referencia opcional centro de costo / faena / area solicitante cuando exista.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="border">
                <TableHeader>
                  <TableRow>
                    {detailHeaders.map(header => (
                      <TableHead key={header} className="border bg-muted/50 p-2 font-bold">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailRows.map((row, rowIndex) => (
                    <TableRow key={`detail-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <TableCell
                          key={`detail-${rowIndex}-${cellIndex}`}
                          className={`border p-2 ${typeof cell === 'number' ? 'text-right tabular-nums' : ''}`}
                        >
                          {typeof cell === 'number' ? cell.toLocaleString(language) : cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center">
              <FileText className="h-16 w-16 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-semibold text-muted-foreground">Sin consumos para el periodo seleccionado</p>
              <p className="mt-2 text-sm text-muted-foreground/80">
                Ajusta el rango de fechas o registra consumos para visualizar reportes operativos.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value.toLocaleString()}</CardTitle>
      </CardHeader>
    </Card>
  );
}
