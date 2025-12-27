import type { ReactNode } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { hasPermission } from '../../../utils/permissions';


interface Props {
    permission: string;
    children: ReactNode;
}


export const RoleBasedRender = ({ permission, children }: Props) => {
    const { role } = useAuth();
    if (!role) return null;
    return hasPermission(role, permission) ? <>{children}</> : null;
};