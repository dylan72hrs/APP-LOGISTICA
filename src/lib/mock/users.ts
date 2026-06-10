import type { UserProfile } from '@/lib/types';

// Demo/mock user for the in-memory prototype. Not production data.
export const mockUsers: UserProfile[] = [
  { uid: 'demo-admin', email: 'admin', name: 'Admin Demo', role: 'admin' },
];
