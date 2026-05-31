import { Role } from '@prisma/client';

export const rolePermissions: Record<Role, string[]> = {
  SUPER_ADMIN: [
    'dashboard',
    'products',
    'stock',
    'sales',
    'reports',
    'whatsapp_orders',
  ],
  BRANCH_MANAGER: [
    'dashboard',
    'products',
    'stock',
    'sales',
    'reports',
  ],
  SELLER: ['dashboard', 'sales', 'whatsapp_orders'],
};

export const hasPermission = (
  role: Role,
  permission: string
): boolean => {
  return rolePermissions[role]?.includes(permission);
};
