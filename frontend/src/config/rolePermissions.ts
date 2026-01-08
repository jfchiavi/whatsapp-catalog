import type { Permission } from '@/types/permissions';

export const rolePermissions: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    'dashboard',
    'products',
    'stock',
    'sales',
    'reports',
    'users',
  ],
  ADMIN: [
    'dashboard',
    'products',
    'stock',
    'sales',
    'reports',
  ],
  BRANCH_MANAGER: [
    'dashboard', 
    'sales', 
    'reports'
],
  SELLER: ['sales'],
};
