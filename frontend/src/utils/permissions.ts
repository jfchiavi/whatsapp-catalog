import { UserRole } from '../types/auth';


export const rolePermissions: Record<UserRole, string[]> = {
    [UserRole.SUPER_ADMIN]: ['*'],
    [UserRole.BRANCH_MANAGER]: ['dashboard', 'products', 'stock', 'sales', 'reports'],
    [UserRole.SALES_ASSISTANT]: ['sales'],
    [UserRole.WAREHOUSE]: ['products', 'stock'],
};


export const hasPermission = (role: UserRole, permission: string) => {
    const permissions = rolePermissions[role];
    return permissions.includes('*') || permissions.includes(permission);
};