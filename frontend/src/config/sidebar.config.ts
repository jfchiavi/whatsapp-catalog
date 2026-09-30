import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart,
  CirclePile,
  Users,
  Settings,
  MessageSquare,
  ClipboardList,
  Building2,
} from 'lucide-react';
import type { Permission } from '@/types/permissions';
import type { UserRole } from '@/types/auth';

export interface SidebarItem {
  label: string;
  path: string;
  icon: React.ElementType;
  permission: Permission;
  excludeRoles?: UserRole[];
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard',
  },
  {
    label: 'Plataforma',
    path: '/platform',
    icon: Building2,
    permission: 'tenants',
  },
  {
    label: 'Tenants',
    path: '/platform/tenants',
    icon: Building2,
    permission: 'tenants',
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
    label: 'Pedidos WhatsApp',
    path: '/whatsapp-orders',
    icon: MessageSquare,
    permission: 'whatsapp_orders',
  },
  {
    label: 'Pedidos',
    path: '/orders',
    icon: ClipboardList,
    permission: 'sales',
    excludeRoles: ['SUPER_ADMIN'],
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
  {
    label: 'Configuración',
    path: '/dashboard/settings',
    icon: Settings,
    permission: 'tenants',
  },
];
