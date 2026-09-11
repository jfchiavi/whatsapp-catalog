import type { Permission } from '@/types/permissions';

export const rolePermissions: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    'dashboard',
    'products',
    'stock',
    'sales',
    'reports',
    'users',
    'tenants',
    'whatsapp_orders',
  ],
  ADMIN: [
    'dashboard',
    'products',
    'stock',
    'sales',
    'reports',
    'users',
    'whatsapp_orders',
  ],
  BRANCH_MANAGER: [
    'dashboard',
    'products',
    'stock',
    'sales',
    'reports',
  ],
  SELLER: [
    'dashboard',
    'sales',
    'whatsapp_orders',
  ],
};
