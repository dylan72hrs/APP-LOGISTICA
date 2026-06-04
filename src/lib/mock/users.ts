import type { UserProfile } from '@/lib/types';

// Demo/mock users for the in-memory prototype. Not production data.
export const mockUsers: UserProfile[] = [
  { uid: 'admin-user-1', email: 'Imaulen@masterdrilling.com', name: 'Admin General', role: 'admin' },
  { uid: 'operator-user-1', email: 'Jcornejo@masterdrilling.com', name: 'Juan Cornejo', role: 'operator', warehouseId: 'stgo-1' },
  { uid: 'operator-user-2', email: 'operador.valpo@stockflow.com', name: 'Ana GÃ³mez', role: 'operator', warehouseId: 'valpo-1' },
  { uid: 'reports-user-1', email: 'Mzarate@masterdrilling.com', name: 'Matias Zarate', role: 'reports', country: 'Chile' },
];
