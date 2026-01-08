import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { rolePermissions } from '@/config/rolePermissions';
import type { Permission } from '@/types/permissions';

interface Props {
  permission: Permission;
  children: ReactNode;
}

export function RoleBasedRender({ permission, children }: Props) {
  return (HasPermission(permission))? <>{children}</> : null;
}


function HasPermission(permission: Permission): boolean {
  const { role } = useAuth();
  if (!role) return false;

  const permissions = rolePermissions[role] ?? [];
  return permissions.includes(permission);
}