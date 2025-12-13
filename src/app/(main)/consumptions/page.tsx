'use client';
import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockWorkers, mockProjects, mockInventory, mockWarehouses, mockConsumptionRecords } from '@/lib/data';
import type { Worker, Project, InventoryItem, ConsumptionRecord } from '@/lib/types';
import { useWarehouse } from '@/lib/hooks/use-warehouse';
import { useLanguage } from '@/lib/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronsUpDown, PlusCircle, Trash2, Printer, Eye, UserSearch, Search, PackageSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ValeConsumo } from '@/components/vale-consumo';
import { useAuth } from '@/lib/hooks/use-auth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';

interface SelectedItem extends InventoryItem {
  consumeQuantity: number;
}

export default function ConsumptionsPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedWarehouseId } = useWarehouse();
  
  const [workers] = useState<Worker[]>(mockWorkers);
  const [projects] = useState<Project[]>(mockProjects);
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [consumptionRecords, setConsumptionRecords] = useState<ConsumptionRecord[]>(mockConsumptionRecords);


  const [rutInput, setRutInput] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  
  const [projectIdInput, setProjectIdInput] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const [productCodeInput, setProductCodeInput] = useState('');
  const productCodeInputRef = useRef<HTMLInputElement>(null);

  const warehouseIdToFilter = useMemo(() => {
    if (user?.role === 'operator') {
      return user.warehouseId;
    }
    return selectedWarehouseId; // For admin
  }, [selectedWarehouseId, user]);
  
  const availableInventory = useMemo(() => {
    if (!warehouseIdToFilter || warehouseIdToFilter === 'all') return [];
    return inventory.filter(item => item.warehouseId === warehouseIdToFilter && item.quantity > 0);
  }, [inventory, warehouseIdToFilter]);
  
  const handleRutSearch = () => {
    const foundWorker = workers.find(w => w.rut.replace(/\./g, '').replace(/-/g, '') === rutInput.replace(/\./g, '').replace(/-/g, ''));
    if (foundWorker) {
        setSelectedWorker(foundWorker);
    } else {
        setSelectedWorker(null);
        toast({ variant: "destructive", title: t('error'), description: t('worker_not_found') });
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

    const foundItem = availableInventory.find(item => item.code.toLowerCase() === code.toLowerCase());

    if (!foundItem) {
      toast({ variant: 'destructive', title: t('error'), description: t('no_product_found') });
      return;
    }
    
    if (selectedItems.some(i => i.id === foundItem.id)) {
      toast({ variant: 'destructive', title: t('error'), description: t('product_already_added') });
      return;
    }

    setSelectedItems(prev => [...prev, { ...foundItem, consumeQuantity: 1 }]);
    if (productCodeInputRef.current) {
        productCodeInputRef.current.value = '';
        setProductCodeInput(''); // Also clear the state
    }
    productCodeInputRef.current?.focus();
  };
  
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    const itemInStock = availableInventory.find(i => i.id === itemId);
    if (newQuantity < 1) newQuantity = 1;
    if (itemInStock && newQuantity > itemInStock.quantity) {
      newQuantity = itemInStock.quantity;
      toast({
        variant: 'destructive',
        title: t('stock_exceeded'),
        description: t('cannot_consume_more_than_available_stock', { stock: itemInStock.quantity.toString() })
      });
    }
    setSelectedItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, consumeQuantity: newQuantity } : item
      )
    );
  };
  
  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  const totalCost = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.cost * item.consumeQuantity, 0);
  }, [selectedItems]);

  const consumptionData = useMemo(() => ({
    id: `VC-${Date.now()}`,
    date: new Date(),
    worker: selectedWorker,
    project: selectedProject,
    items: selectedItems,
    totalCost,
    warehouse: warehouseIdToFilter ? mockWarehouses.find(w => w.id === warehouseIdToFilter)?.name || 'N/A' : 'N/A',
    deliveredBy: user?.name || 'N/A',
  }), [selectedWorker, selectedProject, selectedItems, totalCost, warehouseIdToFilter, user?.name]);

  const handleRegisterConsumption = () => {
    if (!isFormComplete) {
      toast({ variant: 'destructive', title: t('error'), description: t('please_fill_all_fields') });
      return;
    }
    
    // 1. Update inventory (in-memory for now)
    setInventory(prevInventory => {
      const newInventory = [...prevInventory];
      selectedItems.forEach(consumedItem => {
        const itemIndex = newInventory.findIndex(i => i.id === consumedItem.id && i.warehouseId === warehouseIdToFilter);
        if (itemIndex > -1) {
          newInventory[itemIndex].quantity -= consumedItem.consumeQuantity;
        }
      });
      return newInventory;
    });
    
    // 2. Create consumption record (in-memory for now)
    const newRecord: ConsumptionRecord = {
        id: consumptionData.id,
        date: consumptionData.date,
        workerId: consumptionData.worker!.id,
        projectId: consumptionData.project!.id,
        items: consumptionData.items.map(i => ({ itemId: i.id, quantity: i.consumeQuantity })),
        warehouseId: warehouseIdToFilter!,
    };
    setConsumptionRecords(prev => [newRecord, ...prev]);

    toast({ title: t('consumption_registered'), description: t('stock_updated_successfully') });
    
    // 3. Reset form
    setRutInput('');
    setSelectedWorker(null);
    setProjectIdInput('');
    setSelectedProject(null);
    setSelectedItems([]);
  };

  const handlePreview = () => {
    const valeContent = `
      <html>
        <head>
          <title>Vale de Consumo - ${consumptionData.id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { font-family: Arial, sans-serif; }
            @media print {
              #print-button { display: none; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body class="bg-white">
          <div class="max-w-4xl mx-auto p-8">
            <div id="vale-wrapper"></div>
            <div class="mt-8 text-center">
              <button id="print-button" onclick="window.print()" class="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
                ${t('print')}
              </button>
            </div>
          </div>
          <script>
            // This is a trick to render a React component in a new window
            // We pass the stringified component to the new window
            const componentHtml = \`${document.getElementById('vale-for-print')?.innerHTML}\`;
            document.getElementById('vale-wrapper').innerHTML = componentHtml;
          </script>
        </body>
      </html>
    `;

    const valeWindow = window.open('', '_blank');
    if (valeWindow) {
      valeWindow.document.write(valeContent);
      valeWindow.document.close();
    }
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
                <Label htmlFor='rut-input'>{t('worker_rut')}</Label>
                <div className='flex gap-2'>
                    <Input 
                        id="rut-input"
                        value={rutInput}
                        onChange={e => setRutInput(e.target.value)}
                        placeholder={t('enter_rut_and_search')}
                        onKeyDown={(e) => e.key === 'Enter' && handleRutSearch()}
                    />
                    <Button onClick={handleRutSearch} variant="outline" size="icon">
                        <UserSearch />
                    </Button>
                </div>
                {selectedWorker && (
                    <div className='mt-2 text-sm text-muted-foreground p-3 bg-muted rounded-md space-y-1'>
                        <p><strong>{t('name')}:</strong> {selectedWorker.name}</p>
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
          <Button variant="outline" onClick={handlePreview} disabled={!isFormComplete}>
            <Eye className="mr-2" />
            {t('preview_voucher')}
          </Button>
          <Button onClick={handleRegisterConsumption} disabled={!isFormComplete}>
              {t('register_consumption')}
          </Button>
      </div>
    </div>
    
    {/* Hidden component to generate HTML for printing */}
    <div className="hidden">
      <div id="vale-for-print">
        <ValeConsumo data={consumptionData} />
      </div>
    </div>
    </>
  );
}
