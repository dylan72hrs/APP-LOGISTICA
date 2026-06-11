import type { Project } from '@/lib/types';

// Demo/mock projects for the in-memory prototype. Not production data.
// ETAPA 4.7K: proyectos operativos minimos con codigo, centro de costo y dimension financiera.
export const mockProjects: Project[] = [
  {
    id: 'CL01',
    projectCode: 'CL01',
    name: 'División Diamante - El Teniente',
    financialDimension: 'FD-MIN-ELTE',
    costCenter: 'CC-1001',
    manager: 'Gerardo Rojas',
    approver: 'Marcela Soto',
    status: 'active',
    description: 'Faena minera El Teniente, División Diamante.',
  },
  {
    id: 'CL02',
    projectCode: 'CL02',
    name: 'Operación Rancagua',
    financialDimension: 'FD-OPS-RGUA',
    costCenter: 'CC-2002',
    manager: 'Felipe Neira',
    approver: 'Carla Mendez',
    status: 'active',
    description: 'Operación regional Rancagua.',
  },
  {
    id: 'CL03',
    projectCode: 'CL03',
    name: 'Servicio Santiago',
    financialDimension: 'FD-SRV-STGO',
    costCenter: 'CC-3003',
    manager: 'Paula Fuentes',
    approver: 'Andrés Vidal',
    status: 'active',
    description: 'Servicios y mantenimiento Santiago.',
  },
];
