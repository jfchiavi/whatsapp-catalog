import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart,
  CirclePile,
  Users,
} from 'lucide-react';
import type { Permission } from '@/types/permissions';

export interface SidebarItem {
  label: string;
  path: string;
  icon: React.ElementType;
  permission: Permission;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard',
  },
  {
    label: 'Productos',
    path: '/products',
    icon: Package,
    permission: 'products',
  },
  {
    label: 'Stock',
    path: '/stock',
    icon: CirclePile,
    permission: 'stock',
  },
  {
    label: 'Ventas',
    path: '/sales',
    icon: ShoppingCart,
    permission: 'sales',
  },
  {
    label: 'Reportes',
    path: '/reports',
    icon: BarChart,
    permission: 'reports',
  },
  {
    label: 'Usuarios',
    path: '/users',
    icon: Users,
    permission: 'users',
  },
];
