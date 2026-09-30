import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { rolePermissions } from '@/config/rolePermissions';
import type { Permission } from '@/types/permissions';
import type { UserRole } from '@/types/auth';

interface Props {
  permission: Permission;
  excludeRoles?: UserRole[];
  children: ReactNode;
}

export function RoleBasedRender({ permission, excludeRoles, children }: Props) {
  return (HasPermission(permission, excludeRoles))? <>{children}</> : null;
}


function HasPermission(permission: Permission, excludeRoles?: UserRole[]): boolean {
  const { role } = useAuth();
  if (!role) return false;

  if (excludeRoles?.includes(role as UserRole)) return false;

  const permissions = rolePermissions[role] ?? [];
  return permissions.includes(permission);
}