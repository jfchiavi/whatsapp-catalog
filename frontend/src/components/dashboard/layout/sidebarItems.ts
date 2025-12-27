import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  CirclePile,
} from 'lucide-react';

export type SidebarItem = {
  label: string;
  icon: any;
  to: string;
  permission: string;
};

export const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/dashboard',
    permission: 'dashboard',
  },
  {
    label: 'Productos',
    icon: Package,
    to: '/products',
    permission: 'products',
  },
  {
    label: 'Stock',
    icon: CirclePile,
    to: '/stock',
    permission: 'stock',
  },
  {
    label: 'Ventas',
    icon: ShoppingCart,
    to: '/sales',
    permission: 'sales',
  },
  {
    label: 'Reportes',
    icon: BarChart3,
    to: '/reports',
    permission: 'reports',
  },
];
