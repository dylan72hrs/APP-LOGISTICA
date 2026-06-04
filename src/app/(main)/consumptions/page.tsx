'use client';
import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Worker, Project, InventoryItem, ConsumptionRecord } from '@/lib/types';
import { useWarehouse } from '@/lib/hooks/use-warehouse';
import { useLanguage } from '@/lib/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { Eye, Hourglass, CheckCircle, Search, UserSearch, PackageSearch, Trash2 } from 'lucide-react';
import { ValeConsumo } from '@/components/vale-consumo';
import { useAuth } from '@/lib/hooks/use-auth';
import { useData } from '@/lib/hooks/use-data';


interface SelectedItem extends InventoryItem {
  consumeQuantity: number;
}

interface PendingVoucher {
    id: string;
    date: Date;
    worker: Worker | null;
    project: Project | null;
    items: SelectedItem[];
    totalCost: number;
    warehouseId: string;
    warehouseName: string;
    deliveredBy: string;
}

export default function ConsumptionsPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedWarehouseId } = useWarehouse();
  const { 
    workers, 
    projects, 
    inventory, 
    addConsumptionRecord,
    updateInventoryItemQuantity,
    warehouses
  } = useData();

  const [workerRutInput, setWorkerRutInput] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  
  const [projectIdInput, setProjectIdInput] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const [productCodeInput, setProductCodeInput] = useState('');
  const productCodeInputRef = useRef<HTMLInputElement>(null);
  
  const [pendingVouchers, setPendingVouchers] = useState<PendingVoucher[]>([]);
  const [reviewingVoucher, setReviewingVoucher] = useState<PendingVoucher | null>(null);

  const warehouseIdToFilter = useMemo(() => {
    if (user?.role === 'operator') {
      return user.warehouseId;
    }
    return selectedWarehouseId; // For admin
  }, [selectedWarehouseId, user]);
  
  const physicalInventoryInWarehouse = useMemo(() => {
    if (!warehouseIdToFilter || warehouseIdToFilter === 'all') return [];
    return inventory.filter(item => item.warehouseId === warehouseIdToFilter);
  }, [inventory, warehouseIdToFilter]);

  const virtualInventory = useMemo(() => {
    const reservedQuantities: Record<string, number> = {};
    pendingVouchers.forEach(voucher => {
        if (voucher.warehouseId === warehouseIdToFilter) {
            voucher.items.forEach(item => {
                reservedQuantities[item.id] = (reservedQuantities[item.id] || 0) + item.consumeQuantity;
            });
        }
    });

    return physicalInventoryInWarehouse.map(item => ({
        ...item,
        quantity: item.quantity - (reservedQuantities[item.id] || 0),
    }));
  }, [physicalInventoryInWarehouse, pendingVouchers, warehouseIdToFilter]);

  const handleWorkerSearch = () => {
    const foundWorker = workers.find(w => w.rut.replace(/[.-]/g, '') === workerRutInput.replace(/[.-]/g, ''));
    if (foundWorker) {
      setSelectedWorker(foundWorker);
    } else {
      setSelectedWorker(null);
      toast({ variant: 'destructive', title: t('error'), description: t('worker_not_found') });
    }
  };
  
  const handleProjectSearch = () => {
    const foundProject = projects.find(p => p.id.toLowerCase() === projectIdInput.toLowerCase());
    if (foundProject) {
      setSelectedProject(foundProject);
    } else {
      setSelectedProject(null);
      toast({ variant: "destructive", title: t('error'), description: t('project_not_found') });
    }
  };

  const handleProductSearchByCode = () => {
    const code = productCodeInputRef.current?.value;
    if (!code) return;

    if (!warehouseIdToFilter || warehouseIdToFilter === 'all') {
      toast({
        variant: 'destructive',
        title: t('no_warehouse_selected'),
        description: t('admin_select_warehouse_for_product'),
      });
      return;
    }

    const itemInPhysicalInventory = physicalInventoryInWarehouse.find(item => item.code.toLowerCase() === code.toLowerCase());

    if (!itemInPhysicalInventory) {
      toast({ variant: 'destructive', title: t('error'), description: t('no_product_found') });
      return;
    }
    
    if (selectedItems.some(i => i.id === itemInPhysicalInventory.id)) {
      toast({ variant: 'destructive', title: t('error'), description: t('product_already_added') });
      return;
    }
    
    const itemInVirtualInventory = virtualInventory.find(item => item.id === itemInPhysicalInventory.id);
    if (!itemInVirtualInventory || itemInVirtualInventory.quantity <= 0) {
      toast({ variant: 'destructive', title: t('error'), description: t('stock_exceeded') });
      return;
    }

    setSelectedItems(prev => [...prev, { ...itemInVirtualInventory, consumeQuantity: 1 }]);
    if (productCodeInputRef.current) {
        productCodeInputRef.current.value = '';
        setProductCodeInput(''); // Also clear the state
    }
    productCodeInputRef.current?.focus();
  };
  
  const handleQuantityChange = (itemId: string, newQuantityValue: number) => {
    const newQuantity = isNaN(newQuantityValue) ? 1 : newQuantityValue;
    
    const itemInVirtualStock = virtualInventory.find(i => i.id === itemId);
    const availableStock = itemInVirtualStock?.quantity || 0;
    
    let finalQuantity = Math.max(1, newQuantity);

    if (finalQuantity > availableStock) {
      finalQuantity = availableStock;
      toast({
        variant: 'destructive',
        title: t('stock_exceeded'),
        description: t('cannot_consume_more_than_available_stock', { stock: availableStock.toString() })
      });
    }

    setSelectedItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, consumeQuantity: finalQuantity } : item
      )
    );
  };
  
  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  const totalCost = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.cost * item.consumeQuantity, 0);
  }, [selectedItems]);

  const consumptionDataForVoucher = useMemo(() => ({
    id: reviewingVoucher?.id || `VC-${Date.now()}`,
    date: reviewingVoucher?.date || new Date(),
    worker: reviewingVoucher?.worker || selectedWorker,
    project: reviewingVoucher?.project || selectedProject,
    items: reviewingVoucher?.items || selectedItems,
    totalCost: reviewingVoucher?.totalCost || totalCost,
    warehouse: reviewingVoucher?.warehouseName || (warehouseIdToFilter ? warehouses.find(w => w.id === warehouseIdToFilter)?.name || 'N/A' : 'N/A'),
    deliveredBy: reviewingVoucher?.deliveredBy || user?.name || 'N/A',
  }), [reviewingVoucher, selectedWorker, selectedProject, selectedItems, totalCost, warehouseIdToFilter, user?.name, warehouses]);

  const resetForm = () => {
    setWorkerRutInput('');
    setSelectedWorker(null);
    setProjectIdInput('');
    setSelectedProject(null);
    setSelectedItems([]);
  };

  const handleSendToPending = () => {
     if (!isFormComplete) {
      toast({ variant: 'destructive', title: t('error'), description: t('please_fill_all_fields') });
      return;
    }
    const newPendingVoucher: PendingVoucher = {
        id: `VC-${Date.now()}`,
        date: new Date(),
        worker: selectedWorker,
        project: selectedProject,
        items: selectedItems,
        totalCost,
        warehouseId: warehouseIdToFilter!,
        warehouseName: warehouses.find(w => w.id === warehouseIdToFilter)?.name || 'N/A',
        deliveredBy: user?.name || 'N/A',
    };
    setPendingVouchers(prev => [newPendingVoucher, ...prev]);
    toast({ title: t('voucher_sent_to_pending'), description: t('voucher_awaits_approval') });
    resetForm();
  };

  const handleRegisterConsumption = (voucher: PendingVoucher) => {
    // 1. Update inventory
    voucher.items.forEach(consumedItem => {
      const originalItem = inventory.find(i => i.id === consumedItem.id && i.warehouseId === voucher.warehouseId);
      if (originalItem) {
        updateInventoryItemQuantity(consumedItem.id, voucher.warehouseId, originalItem.quantity - consumedItem.consumeQuantity);
      }
    });
    
    // 2. Create consumption record
    const newRecord: ConsumptionRecord = {
        id: voucher.id,
        date: voucher.date,
        workerId: voucher.worker!.id,
        projectId: voucher.project!.id,
        items: voucher.items.map(i => ({ itemId: i.id, quantity: i.consumeQuantity })),
        warehouseId: voucher.warehouseId,
    };
    addConsumptionRecord(newRecord);

    // 3. Remove from pending list
    setPendingVouchers(prev => prev.filter(v => v.id !== voucher.id));

    toast({ title: t('consumption_registered'), description: t('stock_updated_successfully') });
  };

 const handlePreview = (voucher?: PendingVoucher) => {
    if (voucher) {
      setReviewingVoucher(voucher);
    } else {
       if (!isFormComplete) {
        toast({ variant: 'destructive', title: t('error'), description: t('please_fill_all_fields') });
        return;
      }
      setReviewingVoucher(null); // Use current form data
    }
    
    setTimeout(() => {
        const valeContent = document.getElementById('vale-for-print')?.innerHTML;
        if (valeContent) {
        const valeWindow = window.open('', '_blank', 'width=800,height=600');
        if (valeWindow) {
            valeWindow.document.write(`
            <html>
                <head>
                <title>${t('consumption_voucher_preview')}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { font-family: Arial, sans-serif; }
                    @media print {
                    #print-button { display: none; }
                    @page { 
                        size: auto;
                        margin: 1.5cm; 
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    }
                </style>
                </head>
                <body class="bg-white">
                <div class="max-w-4xl mx-auto p-8">
                    ${valeContent}
                    <div class="mt-8 text-center">
                    <button id="print-button" onclick="window.print()" class="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
                        ${t('print')}
                    </button>
                    </div>
                </div>
                </body>
            </html>
            `);
            valeWindow.document.close();
        }
        }
    }, 100);
  };
  const isFormComplete = !!selectedWorker && !!selectedProject && selectedItems.length > 0;

  return (
    <>
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('consumption_record')}</h1>
              <CardDescription>{t('record_epp_delivery')}</CardDescription>
          </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>{t('delivery_details')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <UserSearch />
                    </Button>
                </div>
                {selectedWorker && (
                    <div className='mt-2 text-sm text-muted-foreground p-3 bg-muted rounded-md space-y-1'>
                        <p><strong>{t('name')}:</strong> {selectedWorker.name}</p>
                        <p><strong>{t('rut')}:</strong> {selectedWorker.rut}</p>
                        <p><strong>{t('position')}:</strong> {selectedWorker.position}</p>
                        <p><strong>{t('department')}:</strong> {selectedWorker.department}</p>
                    </div>
                )}
            </div>
            <div className="space-y-2">
                <Label htmlFor='project-id-input'>{t('project_id')}</Label>
                <div className='flex gap-2'>
                    <Input
                        id="project-id-input"
                        value={projectIdInput}
                        onChange={e => setProjectIdInput(e.target.value)}
                        placeholder={t('enter_project_id_and_search')}
                        onKeyDown={(e) => e.key === 'Enter' && handleProjectSearch()}
                    />
                    <Button onClick={handleProjectSearch} variant="outline" size="icon">
                        <Search />
                    </Button>
                </div>
                {selectedProject && (
                    <div className='mt-2 text-sm text-muted-foreground p-3 bg-muted rounded-md space-y-1'>
                        <p><strong>{t('project_name')}:</strong> {selectedProject.name}</p>
                        <p><strong>{t('project_manager')}:</strong> {selectedProject.manager}</p>
                        <p><strong>{t('project_approver')}:</strong> {selectedProject.approver}</p>
                    </div>
                )}
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>{t('products_to_consume')}</CardTitle>
            <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
                <Input
                    id="product-code-input"
                    ref={productCodeInputRef}
                    defaultValue={productCodeInput}
                    placeholder={t('search_product_by_code')}
                    onKeyDown={(e) => e.key === 'Enter' && handleProductSearchByCode()}
                    disabled={!warehouseIdToFilter || warehouseIdToFilter === 'all'}
                />
                <Button onClick={handleProductSearchByCode} variant="outline" size="icon" disabled={!warehouseIdToFilter || warehouseIdToFilter === 'all'}>
                    <PackageSearch />
                </Button>
            </div>
            {user?.role === 'admin' && (!warehouseIdToFilter || warehouseIdToFilter === 'all') && (
                <CardDescription className='text-destructive mt-2'>
                    {t('admin_select_warehouse_for_product')}
                </CardDescription>
            )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('code')}</TableHead>
                <TableHead>{t('description')}</TableHead>
                <TableHead className="text-right">{t('quantity')}</TableHead>
                <TableHead className="text-right">{t('unit_cost')}</TableHead>
                <TableHead className="text-right">{t('total')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedItems.length > 0 ? selectedItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={item.consumeQuantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value, 10))}
                      className="w-20 float-right"
                      min="1"
                      max={item.quantity}
                    />
                  </TableCell>
                  <TableCell className="text-right">${item.cost.toLocaleString(language)}</TableCell>
                  <TableCell className="text-right">${(item.cost * item.consumeQuantity).toLocaleString(language)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">{t('no_products_added')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-end gap-4 p-6">
            <div className="text-xl font-bold">{t('total_cost')}: ${totalCost.toLocaleString(language)}</div>
        </CardFooter>
      </Card>
      <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handlePreview()} disabled={!isFormComplete}>
            <Eye className="mr-2" />
            {t('preview_voucher')}
          </Button>
          <Button onClick={handleSendToPending} disabled={!isFormComplete}>
              <Hourglass className="mr-2" />
              {t('send_to_pending')}
          </Button>
      </div>

       <Card className="mt-8">
        <CardHeader>
          <CardTitle>{t('pending_vouchers_queue')}</CardTitle>
          <CardDescription>{t('vouchers_awaiting_approval')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('worker')}</TableHead>
                <TableHead>{t('project')}</TableHead>
                <TableHead>{t('warehouse')}</TableHead>
                <TableHead className="text-right">{t('total_cost')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingVouchers.length > 0 ? pendingVouchers.map(voucher => (
                <TableRow key={voucher.id}>
                  <TableCell>{new Date(voucher.date).toLocaleDateString(language)}</TableCell>
                  <TableCell>{voucher.worker?.name}</TableCell>
                  <TableCell>{voucher.project?.name}</TableCell>
                  <TableCell>{voucher.warehouseName}</TableCell>
                  <TableCell className="text-right font-medium">${voucher.totalCost.toLocaleString(language)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handlePreview(voucher)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="default" size="sm" onClick={() => handleRegisterConsumption(voucher)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {t('register_consumption')}
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">{t('no_pending_vouchers')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    
    {/* Hidden component to generate HTML for printing */}
    <div className="hidden">
      <div id="vale-for-print">
        <ValeConsumo data={consumptionDataForVoucher} />
      </div>
    </div>
    </>
  );
}
