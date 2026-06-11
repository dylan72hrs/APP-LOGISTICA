import type { ConsumptionRecord, InventoryItem, Project, Warehouse, Worker } from '@/lib/types';
import type { DataRepository, PersistedDataSnapshot } from './data-repository';
import type { MockDataSnapshot } from './mock-repository';

interface ApiWarehouse {
  id: string;
  code?: string;
  name: string;
  city?: string | null;
  country?: string | null;
}

interface ApiWorker {
  id: string;
  rut: string;
  name: string;
  position?: string | null;
  department?: string | null;
  warehouseId?: string | null;
}

interface ApiInventoryItem {
  id: string;
  warehouseId: string;
  sku?: string;
  code?: string;
  description: string;
  size?: string | null;
  quantity: number;
  unitCost?: number | null;
}

interface ApiProject {
  id: string;
  projectCode?: string | null;
  code?: string | null;
  name: string;
  financialDimension?: string | null;
  costCenter?: string | null;
  manager?: string | null;
  approver?: string | null;
  status?: string | null;
  active?: boolean | null;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface ApiConsumption {
  id: string;
  warehouseId: string;
  workerId: string;
  requesterReference?: string | null;
  projectId?: string | null;
  projectIdLegacy?: string | null;
  projectCodeSnapshot?: string | null;
  projectNameSnapshot?: string | null;
  costCenterSnapshot?: string | null;
  financialDimensionSnapshot?: string | null;
  consumedAt?: string | null;
  items: {
    inventoryItemId?: string;
    itemId?: string;
    quantity: number;
  }[];
}

let hasWarnedAboutApiBaseUrl = false;
let knownConsumptionIds = new Set<string>();

function canUseBrowserRequests() {
  return typeof window !== 'undefined' && typeof window.XMLHttpRequest !== 'undefined';
}

function getApiBaseUrl(): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '');

  if (baseUrl) {
    return baseUrl;
  }

  if (!hasWarnedAboutApiBaseUrl) {
    hasWarnedAboutApiBaseUrl = true;
    console.warn('[apiRepository] NEXT_PUBLIC_API_BASE_URL no esta configurado. No se usaran datos API.');
  }

  return null;
}

function requestSync<T>(path: string): T | null {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl || !canUseBrowserRequests()) {
    return null;
  }

  try {
    const request = new window.XMLHttpRequest();
    request.open('GET', `${baseUrl}${path}`, false);
    request.setRequestHeader('Accept', 'application/json');
    request.send();

    if (request.status < 200 || request.status >= 300) {
      console.warn(`[apiRepository] GET ${path} respondio ${request.status}.`);
      return null;
    }

    return JSON.parse(request.responseText) as T;
  } catch {
    console.warn(`[apiRepository] No fue posible leer ${path}.`);
    return null;
  }
}

function postAsync(path: string, payload: unknown) {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl || typeof window === 'undefined' || typeof window.fetch === 'undefined') {
    return;
  }

  window.fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  }).then((response) => {
    if (!response.ok) {
      console.warn(`[apiRepository] POST ${path} respondio ${response.status}.`);
    }
  }).catch(() => {
    console.warn(`[apiRepository] No fue posible enviar ${path}.`);
  });
}

function mapWarehouse(warehouse: ApiWarehouse): Warehouse {
  return {
    id: warehouse.id,
    name: warehouse.name,
    city: warehouse.city ?? '',
    country: warehouse.country ?? '',
  };
}

function mapWorker(worker: ApiWorker): Worker {
  return {
    id: worker.id,
    rut: worker.rut,
    name: worker.name,
    position: worker.position ?? '',
    department: worker.department ?? '',
    warehouseId: worker.warehouseId ?? '',
  };
}

function mapInventoryItem(item: ApiInventoryItem): InventoryItem {
  const code = item.code ?? item.sku ?? item.id;

  return {
    id: item.id,
    code,
    description: item.description,
    size: item.size ?? '',
    quantity: Number(item.quantity) || 0,
    cost: item.unitCost ?? 0,
    warehouseId: item.warehouseId,
  };
}

function mapProject(project: ApiProject): Project {
  const status = project.status === 'inactive' || project.active === false ? 'inactive' : 'active';

  return {
    id: project.id,
    projectCode: project.projectCode ?? project.code ?? project.id,
    name: project.name,
    financialDimension: project.financialDimension ?? '',
    costCenter: project.costCenter ?? '',
    manager: project.manager ?? '',
    approver: project.approver ?? '',
    status,
    description: project.description ?? undefined,
    createdAt: project.createdAt ?? undefined,
    updatedAt: project.updatedAt ?? undefined,
  };
}

function mapConsumption(consumption: ApiConsumption): ConsumptionRecord | null {
  const date = new Date(consumption.consumedAt ?? Date.now());

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    id: consumption.id,
    date,
    workerId: consumption.workerId,
    projectId: consumption.projectId ?? consumption.projectIdLegacy ?? undefined,
    projectCode: consumption.projectCodeSnapshot ?? undefined,
    projectName: consumption.projectNameSnapshot ?? undefined,
    costCenter: consumption.costCenterSnapshot ?? undefined,
    financialDimension: consumption.financialDimensionSnapshot ?? undefined,
    requesterReference: consumption.requesterReference ?? undefined,
    warehouseId: consumption.warehouseId,
    items: consumption.items.map((item) => ({
      itemId: item.inventoryItemId ?? item.itemId ?? '',
      quantity: Number(item.quantity) || 0,
    })).filter((item) => item.itemId && item.quantity > 0),
  };
}

function readApiSnapshot(seed: MockDataSnapshot): MockDataSnapshot {
  const warehousesResponse = requestSync<{ warehouses: ApiWarehouse[] }>('/warehouses?activeOnly=true');
  const workersResponse = requestSync<{ workers: ApiWorker[] }>('/workers?activeOnly=true');
  const inventoryResponse = requestSync<{ items: ApiInventoryItem[] }>('/inventory?activeOnly=true');
  // ETAPA 4.7K: projects vuelve al flujo operativo; el selector de consumo solo
  // muestra activos, pero aqui se cargan todos para resolver historicos.
  const projectsResponse = requestSync<{ projects: ApiProject[] }>('/projects');
  const consumptionsResponse = requestSync<{ consumptions: ApiConsumption[] }>('/consumptions');

  const consumptionRecords = (consumptionsResponse?.consumptions ?? [])
    .map(mapConsumption)
    .filter((record): record is ConsumptionRecord => record !== null);

  knownConsumptionIds = new Set(consumptionRecords.map((record) => record.id));

  return {
    ...seed,
    warehouses: (warehousesResponse?.warehouses ?? []).map(mapWarehouse),
    inventory: (inventoryResponse?.items ?? []).map(mapInventoryItem),
    projects: (projectsResponse?.projects ?? []).map(mapProject),
    workers: (workersResponse?.workers ?? []).map(mapWorker),
    consumptionRecords,
  };
}

function postNewConsumptions(snapshot: PersistedDataSnapshot) {
  const newRecords = snapshot.consumptionRecords.filter((record) => !knownConsumptionIds.has(record.id));

  for (const record of newRecords) {
    knownConsumptionIds.add(record.id);
    postAsync('/consumptions', {
      warehouseId: record.warehouseId,
      workerId: record.workerId,
      requesterReference: record.requesterReference ?? null,
      // projectId es el dato operativo real; el backend valida existencia/estado
      // y genera sus propios snapshots server-side.
      projectId: record.projectId ?? null,
      projectIdLegacy: null,
      notes: '',
      items: record.items.map((item) => ({
        inventoryItemId: item.itemId,
        quantity: item.quantity,
      })),
    });
  }
}

export const apiRepository: DataRepository = {
  load(seed: MockDataSnapshot): MockDataSnapshot {
    return readApiSnapshot(seed);
  },

  save(snapshot: PersistedDataSnapshot) {
    postNewConsumptions(snapshot);
  },
};
