import { Role } from '@prisma/client';

export const rolePermissions: Record<Role, string[]> = {
  SUPER_ADMIN: [
    'dashboard',
    'products',
    'stock',
    'sales',
    'reports',
    'whatsapp_orders',
    'tenants',
    'users',
    'audit',
    'notifications',
    'discounts',
    'customers',
    'import_export',
  ],
  ADMIN: [
    'dashboard',
    'products',
    'stock',
    'sales',
    'reports',
    'whatsapp_orders',
    'users',
    'storefront',
    'audit',
    'notifications',
    'discounts',
    'customers',
    'import_export',
  ],
  BRANCH_MANAGER: [
    'dashboard',
    'products',
    'stock',
    'sales',
    'reports',
    'audit',
    'notifications',
    'customers',
  ],
  SELLER: ['dashboard', 'sales', 'whatsapp_orders', 'notifications', 'customers'],
};

export const hasPermission = (
  role: Role,
  permission: string
): boolean => {
  return rolePermissions[role]?.includes(permission);
};
