'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BrainCircuit, Download, Upload, Loader2, FileText } from 'lucide-react';
import { useLanguage } from '@/lib/hooks/use-language';
import { useData } from '@/lib/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { generateRestockSuggestions } from '@/ai/flows/intelligent-restock-suggestions';
import { useWarehouse } from '@/lib/hooks/use-warehouse';
import * as XLSX from 'xlsx';


interface Suggestion {
  code: string;
  description: string;
  size: string;
  suggestedQuantity: number;
}

export default function RestockPage() {
  const { t } = useLanguage();
  const { inventory, consumptionRecords } = useData();
  const { selectedWarehouseId } = useWarehouse();
  const { toast } = useToast();

  const [leadTime, setLeadTime] = useState('7');
  const [desiredStockDays, setDesiredStockDays] = useState('30');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const handleGenerateSuggestions = async () => {
    setIsLoading(true);
    setSuggestions([]);

    const warehouseToAnalyze = selectedWarehouseId;
    if (!warehouseToAnalyze || warehouseToAnalyze === 'all') {
      toast({
        variant: 'destructive',
        title: t('no_warehouse_selected'),
        description: t('admin_select_warehouse_for_ai'),
      });
      setIsLoading(false);
      return;
    }

    const inventoryData = inventory.filter(item => item.warehouseId === warehouseToAnalyze);
    const consumptionData = consumptionRecords.filter(record => record.warehouseId === warehouseToAnalyze);

    if (inventoryData.length === 0 || consumptionData.length === 0) {
      toast({
        variant: 'destructive',
        title: t('no_data_available'),
        description: t('not_enough_data_for_ai'),
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await generateRestockSuggestions({
        inventoryData: JSON.stringify(inventoryData),
        consumptionData: JSON.stringify(consumptionData),
        leadTimeDays: parseInt(leadTime, 10),
        desiredStockLevelDays: parseInt(desiredStockDays, 10),
      });
      const parsedSuggestions = JSON.parse(result.sugerencias_de_reposicion);
      setSuggestions(parsedSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('ai_suggestion_error'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [t('code'), t('min_stock'), t('max_stock')];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MinMax_Plantilla');
    XLSX.writeFile(wb, 'plantilla_min_max_stock.xlsx');
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">{t('ai_restock')}</h1>
      <CardDescription>{t('use_ai_for_restock_recommendations')}</CardDescription>

      <Card>
        <CardHeader>
          <CardTitle>{t('calculation_parameters')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="lead-time">{t('lead_time_days')}</Label>
            <Input
              id="lead-time"
              type="number"
              value={leadTime}
              onChange={(e) => setLeadTime(e.target.value)}
              placeholder="7"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock-days">{t('desired_stock_level_days')}</Label>
            <Input
              id="stock-days"
              type="number"
              value={desiredStockDays}
              onChange={(e) => setDesiredStockDays(e.target.value)}
              placeholder="30"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={handleGenerateSuggestions} disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BrainCircuit className="mr-2" />
              )}
              {t('generate_suggestions')}
            </Button>
          </div>
        </CardContent>
         <CardContent className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="mr-2"/>
                {t('download_format')}
            </Button>
            <Button variant="outline" disabled>
                <Upload className="mr-2"/>
                {t('upload_min_max')}
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('sugerencias_de_reposicion')}</CardTitle>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                 <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    <p className="mt-4 text-lg font-semibold text-muted-foreground">{t('ai_thinking')}</p>
                    <p className="mt-2 text-sm text-muted-foreground/80">{t('ai_analyzing_data')}</p>
                </div>
            ) : suggestions.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('code')}</TableHead>
                            <TableHead>{t('description')}</TableHead>
                            <TableHead>{t('size_unit')}</TableHead>
                            <TableHead className="text-right">{t('suggested_quantity_to_order')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {suggestions.map((item) => (
                            <TableRow key={item.code}>
                                <TableCell className="font-medium">{item.code}</TableCell>
                                <TableCell>{item.description}</TableCell>
                                <TableCell>{item.size}</TableCell>
                                <TableCell className="text-right font-bold">{item.suggestedQuantity}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center">
                    <FileText className="h-16 w-16 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-semibold text-muted-foreground">{t('generate_suggestions_to_see_results')}</p>
                    <p className="mt-2 text-sm text-muted-foreground/80">{t('ai_will_calculate_eoq')}</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
