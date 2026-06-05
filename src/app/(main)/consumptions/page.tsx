'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
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
  consumeQuantityInput: string;
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

const MAX_SUGGESTIONS = 5;
const SELECT_SPECIFIC_WAREHOUSE_MESSAGE = 'Debes seleccionar una bodega específica para registrar consumos.';

interface ValidatedConsumptionItem {
  currentItem: InventoryItem;
  quantity: number;
}

interface ValidationSuccess {
  valid: true;
  warehouseId: string;
  worker: Worker;
  project: Project;
  items: ValidatedConsumptionItem[];
  totalCost: number;
}

interface ValidationFailure {
  valid: false;
  message: string;
}

type ConsumptionValidationResult = ValidationSuccess | ValidationFailure;

function normalizeSearchValue(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[.-]/g, '')
    .trim();
}

function getMatchRank(value: string, query: string) {
  const normalizedValue = normalizeSearchValue(value);
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) return Number.POSITIVE_INFINITY;
  if (normalizedValue === normalizedQuery) return 0;
  if (normalizedValue.startsWith(normalizedQuery)) return 1;
  if (normalizedValue.includes(normalizedQuery)) return 2;
  return Number.POSITIVE_INFINITY;
}

function getRankedMatches<T>(items: T[], query: string, getFields: (item: T) => string[]) {
  return items
    .map(item => ({
      item,
      rank: Math.min(...getFields(item).map(field => getMatchRank(field, query))),
    }))
    .filter(match => Number.isFinite(match.rank))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, MAX_SUGGESTIONS)
    .map(match => match.item);
}

function parseQuantityInput(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const quantity = Number(trimmedValue);
  if (!Number.isFinite(quantity)) return null;

  return quantity;
}

function isValidCost(cost: number) {
  return Number.isFinite(cost) && cost >= 0;
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
  const [debouncedWorkerRutInput, setDebouncedWorkerRutInput] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  
  const [projectIdInput, setProjectIdInput] = useState('');
  const [debouncedProjectIdInput, setDebouncedProjectIdInput] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const [productCodeInput, setProductCodeInput] = useState('');
  const [debouncedProductCodeInput, setDebouncedProductCodeInput] = useState('');
  const productCodeInputRef = useRef<HTMLInputElement>(null);
  const previousWarehouseIdRef = useRef<string | undefined>(undefined);
  
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

  const getSpecificWarehouseId = (warehouseId = warehouseIdToFilter) => {
    if (!warehouseId || warehouseId === 'all') return null;
    return warehouseId;
  };

  const showValidationError = (description: string) => {
    toast({
      variant: 'destructive',
      title: t('error'),
      description,
    });
  };

  const validateQuantity = (rawValue: string, availableStock: number): ValidationFailure | { valid: true; quantity: number } => {
    if (!rawValue.trim()) {
      return { valid: false, message: 'La cantidad no puede estar vacía.' };
    }

    const quantity = parseQuantityInput(rawValue);

    if (quantity === null) {
      return { valid: false, message: 'La cantidad debe ser numérica.' };
    }

    if (quantity <= 0) {
      return { valid: false, message: 'La cantidad debe ser mayor que cero.' };
    }

    if (quantity > availableStock) {
      return { valid: false, message: 'Stock insuficiente en la bodega activa.' };
    }

    return { valid: true, quantity };
  };

  const validateConsumptionDraft = (): ConsumptionValidationResult => {
    const warehouseId = getSpecificWarehouseId();
    if (!warehouseId) {
      return { valid: false, message: SELECT_SPECIFIC_WAREHOUSE_MESSAGE };
    }

    if (!selectedWorker) {
      return { valid: false, message: 'Selecciona un trabajador válido.' };
    }

    const currentWorker = workers.find(worker => worker.id === selectedWorker.id);
    if (!currentWorker) {
      return { valid: false, message: 'El trabajador seleccionado ya no existe. Selecciona un trabajador válido.' };
    }

    if (!selectedProject) {
      return { valid: false, message: 'Selecciona un proyecto válido.' };
    }

    const currentProject = projects.find(project => project.id === selectedProject.id);
    if (!currentProject) {
      return { valid: false, message: 'El proyecto seleccionado ya no existe. Selecciona un proyecto válido.' };
    }

    if (selectedItems.length === 0) {
      return { valid: false, message: 'Agrega al menos un producto.' };
    }

    const validatedItems: ValidatedConsumptionItem[] = [];
    let validatedTotalCost = 0;

    for (const selectedItem of selectedItems) {
      if (selectedItem.warehouseId !== warehouseId) {
        return { valid: false, message: 'El producto seleccionado ya no existe o pertenece a otra bodega.' };
      }

      const currentItem = inventory.find(item => item.id === selectedItem.id && item.warehouseId === warehouseId);
      const availableItem = virtualInventory.find(item => item.id === selectedItem.id && item.warehouseId === warehouseId);

      if (!currentItem || !availableItem) {
        return { valid: false, message: 'El producto seleccionado ya no existe o pertenece a otra bodega.' };
      }

      if (availableItem.quantity <= 0) {
        return { valid: false, message: 'No puedes consumir un producto con stock cero.' };
      }

      const quantityValidation = validateQuantity(selectedItem.consumeQuantityInput, availableItem.quantity);
      if (!quantityValidation.valid) return quantityValidation;

      if (!isValidCost(currentItem.cost)) {
        return { valid: false, message: 'El costo unitario del producto es inválido.' };
      }

      validatedTotalCost += currentItem.cost * quantityValidation.quantity;
      validatedItems.push({ currentItem, quantity: quantityValidation.quantity });
    }

    if (!Number.isFinite(validatedTotalCost) || validatedTotalCost < 0) {
      return { valid: false, message: 'El total del consumo es inválido.' };
    }

    return {
      valid: true,
      warehouseId,
      worker: currentWorker,
      project: currentProject,
      items: validatedItems,
      totalCost: validatedTotalCost,
    };
  };

  const validateVoucherBeforeRegister = (voucher: PendingVoucher): ConsumptionValidationResult => {
    const activeWarehouseId = getSpecificWarehouseId();
    if (!activeWarehouseId) {
      return { valid: false, message: SELECT_SPECIFIC_WAREHOUSE_MESSAGE };
    }

    if (voucher.warehouseId !== activeWarehouseId) {
      return { valid: false, message: 'El vale pertenece a otra bodega. Selecciona la bodega correcta o crea un nuevo consumo.' };
    }

    if (!voucher.worker) {
      return { valid: false, message: 'Selecciona un trabajador válido.' };
    }

    const currentWorker = workers.find(worker => worker.id === voucher.worker?.id);
    if (!currentWorker) {
      return { valid: false, message: 'El trabajador seleccionado ya no existe. Selecciona un trabajador válido.' };
    }

    if (!voucher.project) {
      return { valid: false, message: 'Selecciona un proyecto válido.' };
    }

    const currentProject = projects.find(project => project.id === voucher.project?.id);
    if (!currentProject) {
      return { valid: false, message: 'El proyecto seleccionado ya no existe. Selecciona un proyecto válido.' };
    }

    if (voucher.items.length === 0) {
      return { valid: false, message: 'Agrega al menos un producto.' };
    }

    const validatedItems: ValidatedConsumptionItem[] = [];
    let validatedTotalCost = 0;

    for (const voucherItem of voucher.items) {
      if (voucherItem.warehouseId !== voucher.warehouseId) {
        return { valid: false, message: 'El producto seleccionado ya no existe o pertenece a otra bodega.' };
      }

      const currentItem = inventory.find(item => item.id === voucherItem.id && item.warehouseId === voucher.warehouseId);
      if (!currentItem) {
        return { valid: false, message: 'El producto seleccionado ya no existe o pertenece a otra bodega.' };
      }

      if (currentItem.quantity <= 0) {
        return { valid: false, message: 'No puedes consumir un producto con stock cero.' };
      }

      const quantityValidation = validateQuantity(voucherItem.consumeQuantityInput, currentItem.quantity);
      if (!quantityValidation.valid) return quantityValidation;

      if (!isValidCost(currentItem.cost)) {
        return { valid: false, message: 'El costo unitario del producto es inválido.' };
      }

      validatedTotalCost += currentItem.cost * quantityValidation.quantity;
      validatedItems.push({ currentItem, quantity: quantityValidation.quantity });
    }

    if (!Number.isFinite(validatedTotalCost) || validatedTotalCost < 0) {
      return { valid: false, message: 'El total del consumo es inválido.' };
    }

    return {
      valid: true,
      warehouseId: voucher.warehouseId,
      worker: currentWorker,
      project: currentProject,
      items: validatedItems,
      totalCost: validatedTotalCost,
    };
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedWorkerRutInput(workerRutInput), 180);
    return () => window.clearTimeout(timeoutId);
  }, [workerRutInput]);

  useEffect(() => {
    const previousWarehouseId = previousWarehouseIdRef.current;
    previousWarehouseIdRef.current = warehouseIdToFilter;

    if (previousWarehouseId === undefined || previousWarehouseId === warehouseIdToFilter) {
      return;
    }

    const currentWarehouseId = getSpecificWarehouseId();
    const hasSelectedItemsFromOtherWarehouse = selectedItems.some(item => !currentWarehouseId || item.warehouseId !== currentWarehouseId);
    const hasPendingVouchersFromOtherWarehouse = pendingVouchers.some(voucher => !currentWarehouseId || voucher.warehouseId !== currentWarehouseId);
    const hasReviewingVoucherFromOtherWarehouse = Boolean(reviewingVoucher && (!currentWarehouseId || reviewingVoucher.warehouseId !== currentWarehouseId));
    const removedOutOfScopeData = hasSelectedItemsFromOtherWarehouse || hasPendingVouchersFromOtherWarehouse || hasReviewingVoucherFromOtherWarehouse;

    setSelectedItems(prev => {
      const nextItems = currentWarehouseId ? prev.filter(item => item.warehouseId === currentWarehouseId) : [];
      return nextItems;
    });

    setPendingVouchers(prev => {
      const nextVouchers = currentWarehouseId ? prev.filter(voucher => voucher.warehouseId === currentWarehouseId) : [];
      return nextVouchers;
    });

    setReviewingVoucher(prev => {
      if (!prev) return prev;
      if (currentWarehouseId && prev.warehouseId === currentWarehouseId) return prev;
      return null;
    });

    if (removedOutOfScopeData) {
      toast({
        title: t('warehouse'),
        description: 'Se limpiaron productos o vales pendientes que pertenecían a otra bodega.',
      });
    }
  }, [pendingVouchers, reviewingVoucher, selectedItems, warehouseIdToFilter, t, toast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedProjectIdInput(projectIdInput), 180);
    return () => window.clearTimeout(timeoutId);
  }, [projectIdInput]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedProductCodeInput(productCodeInput), 180);
    return () => window.clearTimeout(timeoutId);
  }, [productCodeInput]);

  const workerSuggestions = useMemo(() => {
    if (!debouncedWorkerRutInput || selectedWorker) return [];
    return getRankedMatches(workers, debouncedWorkerRutInput, worker => [worker.rut, worker.name, worker.id]);
  }, [debouncedWorkerRutInput, selectedWorker, workers]);

  const projectSuggestions = useMemo(() => {
    if (!debouncedProjectIdInput || selectedProject) return [];
    return getRankedMatches(projects, debouncedProjectIdInput, project => [project.id, project.name, project.manager]);
  }, [debouncedProjectIdInput, selectedProject, projects]);

  const productSuggestions = useMemo(() => {
    if (!debouncedProductCodeInput || !warehouseIdToFilter || warehouseIdToFilter === 'all') return [];
    return getRankedMatches(physicalInventoryInWarehouse, debouncedProductCodeInput, item => [item.code, item.description, item.size]);
  }, [debouncedProductCodeInput, physicalInventoryInWarehouse, warehouseIdToFilter]);

  const selectWorker = (worker: Worker) => {
    setSelectedWorker(worker);
    setWorkerRutInput(worker.rut);
  };

  const selectProject = (project: Project) => {
    setSelectedProject(project);
    setProjectIdInput(project.id);
  };

  const handleWorkerSearch = () => {
    const foundWorker = getRankedMatches(workers, workerRutInput, worker => [worker.rut, worker.name, worker.id])[0];
    if (foundWorker) {
      selectWorker(foundWorker);
    } else {
      setSelectedWorker(null);
      toast({ variant: 'destructive', title: t('error'), description: t('worker_not_found') });
    }
  };
  
  const handleProjectSearch = () => {
    const foundProject = getRankedMatches(projects, projectIdInput, project => [project.id, project.name, project.manager])[0];
    if (foundProject) {
      selectProject(foundProject);
    } else {
      setSelectedProject(null);
      toast({ variant: "destructive", title: t('error'), description: t('project_not_found') });
    }
  };

  const addProductToSelection = (itemInPhysicalInventory: InventoryItem) => {
    const warehouseId = getSpecificWarehouseId();

    if (!warehouseId) {
      toast({
        variant: 'destructive',
        title: t('no_warehouse_selected'),
        description: 'Selecciona una bodega específica antes de agregar productos.',
      });
      return;
    }

    if (itemInPhysicalInventory.warehouseId !== warehouseId) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: 'El producto seleccionado ya no existe o pertenece a otra bodega.',
      });
      return;
    }
    
    if (selectedItems.some(i => i.id === itemInPhysicalInventory.id && i.warehouseId === warehouseId)) {
      toast({ variant: 'destructive', title: t('error'), description: t('product_already_added') });
      return;
    }
    
    const itemInVirtualInventory = virtualInventory.find(item => item.id === itemInPhysicalInventory.id && item.warehouseId === warehouseId);
    if (!itemInVirtualInventory || itemInVirtualInventory.quantity <= 0) {
      toast({ variant: 'destructive', title: t('error'), description: 'No puedes consumir un producto con stock cero.' });
      return;
    }

    if (!isValidCost(itemInVirtualInventory.cost)) {
      toast({ variant: 'destructive', title: t('error'), description: 'El costo unitario del producto es inválido.' });
      return;
    }

    setSelectedItems(prev => [...prev, { ...itemInVirtualInventory, consumeQuantity: 1, consumeQuantityInput: '1' }]);
    if (productCodeInputRef.current) {
        productCodeInputRef.current.value = '';
    }
    setProductCodeInput('');
    productCodeInputRef.current?.focus();
  };

  const handleProductSearchByCode = () => {
    const code = productCodeInput.trim();
    if (!code) return;

    if (!getSpecificWarehouseId()) {
      toast({
        variant: 'destructive',
        title: t('no_warehouse_selected'),
        description: 'Selecciona una bodega específica antes de agregar productos.',
      });
      return;
    }

    const itemInPhysicalInventory = getRankedMatches(physicalInventoryInWarehouse, code, item => [item.code, item.description, item.size])[0];

    if (!itemInPhysicalInventory) {
      toast({ variant: 'destructive', title: t('error'), description: t('no_product_found') });
      return;
    }

    addProductToSelection(itemInPhysicalInventory);
  };
  
  const handleQuantityChange = (itemId: string, warehouseId: string, newQuantityValue: string) => {
    const itemInVirtualStock = virtualInventory.find(i => i.id === itemId && i.warehouseId === warehouseId);
    const availableStock = itemInVirtualStock?.quantity || 0;
    const quantity = parseQuantityInput(newQuantityValue);

    if (newQuantityValue.trim() === '') {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: 'La cantidad no puede estar vacía.',
      });
    } else if (quantity === null) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: 'La cantidad debe ser numérica.',
      });
    } else if (quantity <= 0) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: 'La cantidad debe ser mayor que cero.',
      });
    } else if (quantity > availableStock) {
      toast({
        variant: 'destructive',
        title: t('stock_exceeded'),
        description: t('cannot_consume_more_than_available_stock', { stock: availableStock.toString() })
      });
    }

    setSelectedItems(prev =>
      prev.map(item =>
        item.id === itemId && item.warehouseId === warehouseId
          ? { ...item, consumeQuantity: quantity ?? 0, consumeQuantityInput: newQuantityValue }
          : item
      )
    );
  };
  
  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  const totalCost = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const quantity = parseQuantityInput(item.consumeQuantityInput);
      if (quantity === null || quantity <= 0 || !isValidCost(item.cost)) return acc;

      return acc + item.cost * quantity;
    }, 0);
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
    setProductCodeInput('');
    setSelectedItems([]);
  };

  const handleSendToPending = () => {
    const validation = validateConsumptionDraft();
    if (!validation.valid) {
      showValidationError(validation.message);
      return;
    }

    const newPendingVoucher: PendingVoucher = {
        id: `VC-${Date.now()}`,
        date: new Date(),
        worker: validation.worker,
        project: validation.project,
        items: validation.items.map(({ currentItem, quantity }) => ({
          ...currentItem,
          consumeQuantity: quantity,
          consumeQuantityInput: String(quantity),
        })),
        totalCost: validation.totalCost,
        warehouseId: validation.warehouseId,
        warehouseName: warehouses.find(w => w.id === validation.warehouseId)?.name || 'N/A',
        deliveredBy: user?.name || 'N/A',
    };
    setPendingVouchers(prev => [newPendingVoucher, ...prev]);
    toast({ title: t('voucher_sent_to_pending'), description: t('voucher_awaits_approval') });
    resetForm();
  };

  const handleRegisterConsumption = (voucher: PendingVoucher) => {
    const validation = validateVoucherBeforeRegister(voucher);
    if (!validation.valid) {
      showValidationError(validation.message);
      return;
    }

    validation.items.forEach(({ currentItem, quantity }) => {
      updateInventoryItemQuantity(currentItem.id, validation.warehouseId, currentItem.quantity - quantity);
    });
    
    const newRecord: ConsumptionRecord = {
        id: voucher.id,
        date: voucher.date,
        workerId: validation.worker.id,
        projectId: validation.project.id,
        items: validation.items.map(({ currentItem, quantity }) => ({ itemId: currentItem.id, quantity })),
        warehouseId: validation.warehouseId,
    };
    addConsumptionRecord(newRecord);

    setPendingVouchers(prev => prev.filter(v => v.id !== voucher.id));

    toast({ title: t('consumption_registered'), description: t('stock_updated_successfully') });
  };

 const handlePreview = (voucher?: PendingVoucher) => {
    if (voucher) {
      const validation = validateVoucherBeforeRegister(voucher);
      if (!validation.valid) {
        showValidationError(validation.message);
        return;
      }
      setReviewingVoucher(voucher);
    } else {
      const validation = validateConsumptionDraft();
      if (!validation.valid) {
        showValidationError(validation.message);
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
                        onChange={e => {
                            setWorkerRutInput(e.target.value);
                            setSelectedWorker(null);
                        }}
                        placeholder={t('enter_rut_and_search')}
                        onKeyDown={(e) => e.key === 'Enter' && handleWorkerSearch()}
                    />
                    <Button onClick={handleWorkerSearch} variant="outline" size="icon">
                        <UserSearch />
                    </Button>
                </div>
                {workerSuggestions.length > 0 && (
                    <div className="rounded-md border bg-background shadow-sm">
                        {workerSuggestions.map(worker => (
                            <button
                                key={worker.id}
                                type="button"
                                className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted"
                                onClick={() => selectWorker(worker)}
                            >
                                <span className="font-medium">{worker.name}</span>
                                <span className="text-xs text-muted-foreground">{worker.rut} · {worker.position}</span>
                            </button>
                        ))}
                    </div>
                )}
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
                        onChange={e => {
                            setProjectIdInput(e.target.value);
                            setSelectedProject(null);
                        }}
                        placeholder={t('enter_project_id_and_search')}
                        onKeyDown={(e) => e.key === 'Enter' && handleProjectSearch()}
                    />
                    <Button onClick={handleProjectSearch} variant="outline" size="icon">
                        <Search />
                    </Button>
                </div>
                {projectSuggestions.length > 0 && (
                    <div className="rounded-md border bg-background shadow-sm">
                        {projectSuggestions.map(project => (
                            <button
                                key={project.id}
                                type="button"
                                className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted"
                                onClick={() => selectProject(project)}
                            >
                                <span className="font-medium">{project.id}</span>
                                <span className="text-xs text-muted-foreground">{project.name}</span>
                            </button>
                        ))}
                    </div>
                )}
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
            <div className="mt-2 w-full max-w-sm space-y-2">
                <div className="flex items-center space-x-2">
                    <Input
                        id="product-code-input"
                        ref={productCodeInputRef}
                        value={productCodeInput}
                        onChange={e => setProductCodeInput(e.target.value)}
                        placeholder={t('search_product_by_code')}
                        onKeyDown={(e) => e.key === 'Enter' && handleProductSearchByCode()}
                        disabled={!warehouseIdToFilter || warehouseIdToFilter === 'all'}
                    />
                    <Button onClick={handleProductSearchByCode} variant="outline" size="icon" disabled={!warehouseIdToFilter || warehouseIdToFilter === 'all'}>
                        <PackageSearch />
                    </Button>
                </div>
                {productSuggestions.length > 0 && (
                    <div className="rounded-md border bg-background shadow-sm">
                        {productSuggestions.map(item => (
                            <button
                                key={`${item.id}-${item.warehouseId}`}
                                type="button"
                                className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted"
                                onClick={() => addProductToSelection(item)}
                            >
                                <span className="font-medium">{item.code} · {item.description}</span>
                                <span className="text-xs text-muted-foreground">Stock: {item.quantity} · {item.size}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {user?.role === 'admin' && (!warehouseIdToFilter || warehouseIdToFilter === 'all') && (
                <CardDescription className='text-destructive mt-2'>
                    Debes seleccionar una bodega para continuar. Usa el selector de la esquina superior izquierda.
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
              {selectedItems.length > 0 ? selectedItems.map(item => {
                const quantity = parseQuantityInput(item.consumeQuantityInput);
                const lineTotal = quantity !== null && quantity > 0 && isValidCost(item.cost)
                  ? item.cost * quantity
                  : 0;

                return (
                  <TableRow key={`${item.id}-${item.warehouseId}`}>
                    <TableCell>{item.code}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={item.consumeQuantityInput}
                        onChange={(e) => handleQuantityChange(item.id, item.warehouseId, e.target.value)}
                        className="w-20 float-right"
                        min="1"
                        max={item.quantity}
                      />
                    </TableCell>
                    <TableCell className="text-right">${item.cost.toLocaleString(language)}</TableCell>
                    <TableCell className="text-right">${lineTotal.toLocaleString(language)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              }) : (
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
          <Button variant="outline" onClick={() => handlePreview()}>
            <Eye className="mr-2" />
            {t('preview_voucher')}
          </Button>
          <Button onClick={handleSendToPending}>
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
