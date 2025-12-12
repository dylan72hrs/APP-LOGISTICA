'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockWorkers, mockProjects, mockInventory, mockWarehouses } from '@/lib/data';
import type { Worker, Project, InventoryItem } from '@/lib/types';
import { useWarehouse } from '@/lib/hooks/use-warehouse';
import { useLanguage } from '@/lib/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronsUpDown, PlusCircle, Trash2, Printer, Eye, UserSearch, Search, PackageSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ValeConsumo, ValeConsumoPreview } from '@/components/vale-consumo';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useAuth } from '@/lib/hooks/use-auth';

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

  const [rutInput, setRutInput] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  
  const [projectIdInput, setProjectIdInput] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const [productCodeInput, setProductCodeInput] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const warehouseIdToFilter = useMemo(() => {
    let warehouseId: string | undefined;
    if (user?.role === 'operator' && user.warehouseId) {
      warehouseId = user.warehouseId;
    } else if (user?.role === 'admin' && selectedWarehouseId !== 'all') {
      warehouseId = selectedWarehouseId;
    }
    return warehouseId;
  }, [selectedWarehouseId, user]);
  
  const availableInventory = useMemo(() => {
    if (!warehouseIdToFilter) return [];
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
    if (!productCodeInput) return;
    if (!warehouseIdToFilter) {
      toast({
        variant: 'destructive',
        title: t('no_warehouse_selected'),
        description: t('admin_select_warehouse_for_product'),
      });
      return;
    }

    const foundItem = availableInventory.find(item => item.code.toLowerCase() === productCodeInput.toLowerCase());

    if (!foundItem) {
      toast({ variant: 'destructive', title: t('error'), description: t('no_product_found') });
      return;
    }
    
    if (selectedItems.some(i => i.id === foundItem.id)) {
      toast({ variant: 'destructive', title: t('error'), description: t('product_already_added') });
      return;
    }

    setSelectedItems(prev => [...prev, { ...foundItem, consumeQuantity: 1 }]);
    setProductCodeInput('');
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

  const handleRegisterConsumption = () => {
    if (!selectedWorker || !selectedProject || selectedItems.length === 0) {
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
    
    // 2. TODO: Create consumption record (in-memory for now)
    console.log({
      worker: selectedWorker,
      project: selectedProject,
      items: selectedItems,
      totalCost
    });

    toast({ title: t('consumption_registered'), description: t('stock_updated_successfully') });
    
    // 3. Reset form
    setRutInput('');
    setSelectedWorker(null);
    setProjectIdInput('');
    setSelectedProject(null);
    setSelectedItems([]);
  };

  const isFormComplete = selectedWorker && selectedProject && selectedItems.length > 0;

  const consumptionData = {
    id: `VC-${Date.now()}`,
    date: new Date(),
    worker: selectedWorker,
    project: selectedProject,
    items: selectedItems,
    totalCost,
    warehouse: warehouseIdToFilter ? mockWarehouses.find(w => w.id === warehouseIdToFilter)?.name || 'N/A' : 'N/A',
    deliveredBy: user?.name || 'N/A',
  };


  return (
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
                    value={productCodeInput}
                    onChange={(e) => setProductCodeInput(e.target.value)}
                    placeholder={t('search_product_by_code')}
                    onKeyDown={(e) => e.key === 'Enter' && handleProductSearchByCode()}
                    disabled={!warehouseIdToFilter}
                />
                <Button onClick={handleProductSearchByCode} variant="outline" size="icon" disabled={!warehouseIdToFilter}>
                    <PackageSearch />
                </Button>
            </div>
            {!warehouseIdToFilter && user?.role === 'admin' && (
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
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)} disabled={!isFormComplete}>
            <Eye className="mr-2" />
            {t('preview_voucher')}
          </Button>
          <Button onClick={handleRegisterConsumption} disabled={!isFormComplete}>
              {t('register_consumption')}
          </Button>
      </div>

       <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{t('consumption_voucher_preview')}</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <ValeConsumoPreview data={consumptionData} />
          </div>
          <div id="vale-consumo-printable" className="hidden print:block">
            <ValeConsumo data={consumptionData} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ComboboxProps {
    items: { value: string; label: string }[];
    selectedValue: string | undefined;
    onSelect: (value: string | undefined) => void;
    placeholder: string;
    searchPlaceholder: string;
}

function Combobox({ items, selectedValue, onSelect, placeholder, searchPlaceholder }: ComboboxProps) {
    const [open, setOpen] = useState(false);
  
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedValue
              ? items.find((item) => item.value === selectedValue)?.label
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
                <CommandEmpty>{t('no_results_found')}</CommandEmpty>
                <CommandGroup>
                {items.map((item) => (
                    <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={(currentValue) => {
                        onSelect(currentValue === selectedValue ? undefined : currentValue);
                        setOpen(false);
                    }}
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        selectedValue === item.value ? "opacity-100" : "opacity-0"
                        )}
                    />
                    {item.label}
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
}

function t(key: string, options?: any){
    const { t: translate } = useLanguage();
    return translate(key, options);
}
