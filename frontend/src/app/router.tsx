import { createBrowserRouter } from "react-router-dom";
import Home from "./routes/web/Home";
import ProductDetail from "./routes/web/ProductDetail";
import SearchResults from "./routes/web/SearchResults";
import TenantHome from "./routes/web/TenantHome";
import TenantDomainHome from "./routes/web/TenantDomainHome";
import TenantCatalog from "./routes/web/TenantCatalog";
import TenantProductDetail from "./routes/web/TenantProductDetail";
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/dashboard/auth/ProtectedRoute';
import LoginPage  from '@/features/auth/LoginPage';
import HomeDashBoard from '@/features/dashboard/Home';
import ProductsPage from '@/features/products/ProductsPage';
import StockPage from '@/features/stock/StockPage';
import SalesListPage from '@/features/sales/SalesListPage';
import CreateSalePage from '@/features/sales/CreateSalePage';
import ReportsPage from '@/features/reports/ReportsPage';
import TenantSettingsPage from '@/features/settings/TenantSettingsPage';
import StorefrontEditorPage from '@/features/settings/StorefrontEditorPage';
import WhatsAppOrdersPage from '@/features/whatsapp/WhatsAppOrdersPage';
import OrdersPage from '@/features/orders/OrdersPage';
import OrderDetailPage from '@/features/orders/OrderDetailPage';
import TenantsPage from '@/features/platform/TenantsPage';
import PlatformDashboard from '@/features/platform/PlatformDashboard';
import UsersPage from '@/features/users/UsersPage';
import DiscountsPage from '@/features/discounts/DiscountsPage';
import CustomersPage from '@/features/customers/CustomersPage';
import CustomerDetailPage from '@/features/customers/CustomerDetailPage';
import NotificationsPage from '@/features/notifications/NotificationsPage';
import ImportPage from '@/features/import/ImportPage';
import ErrorPage from '@/components/dashboard/layout/ErrorPage';

export const router = createBrowserRouter([
  // Marketplace global (dominio raíz)
  { path: "/", element: <TenantDomainHome /> },
  { path: "/catalogo", element: <TenantCatalog /> },
  { path: "/product/:id", element: <TenantProductDetail /> },

  // Tienda por tenant
  { path: "/t/:tenantSlug", element: <TenantHome /> },
  { path: "/t/:tenantSlug/catalogo", element: <TenantCatalog /> },
  { path: "/t/:tenantSlug/product/:id", element: <TenantProductDetail /> },

  // Legacy routes (mantener compatibilidad)
  { path: "/legacy", element: <Home /> },
  { path: "/legacy/product/:id", element: <ProductDetail /> },
  { path: "/legacy/search", element: <SearchResults /> },

  //Dashboard and other routes can be added here in the future
  {
    path: '/login',
    lazy: async () => {
      return { Component: LoginPage };
    },
  },
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: '/dashboard',
            children: [
              { index: true, lazy:async () => {return {Component: HomeDashBoard};} },
              { path: 'settings', lazy: async () => {return {Component: TenantSettingsPage }}},
              { path: 'storefront', lazy: async () => {return {Component: StorefrontEditorPage }}},
            ],
          },
          { path: '/products', lazy: async () => {return {Component: ProductsPage}; }},
          { path: '/stock', lazy: async () => {return {Component: StockPage }}},
          { path: '/sales', lazy: async () => {return {Component: SalesListPage }} },
          { path: '/sales/new', lazy: async () => {return {Component: CreateSalePage }} },
          //TODO: /sales/:id       → SaleDetailPage (opcional)
          { path: '/reports', lazy: async () => {return {Component: ReportsPage }}},
          { path: '/whatsapp-orders', lazy: async () => {return {Component: WhatsAppOrdersPage }}},
          { path: '/orders', lazy: async () => {return {Component: OrdersPage }}},
          { path: '/orders/:id', lazy: async () => {return {Component: OrderDetailPage }}},
          { path: '/users', lazy: async () => {return {Component: UsersPage }}},
          { path: '/discounts', lazy: async () => {return {Component: DiscountsPage }}},
          { path: '/customers', lazy: async () => {return {Component: CustomersPage }}},
          { path: '/customers/:id', lazy: async () => {return {Component: CustomerDetailPage }}},
          { path: '/notifications', lazy: async () => {return {Component: NotificationsPage }}},
          { path: '/import', lazy: async () => {return {Component: ImportPage }}},
          {
            path: '/platform',
            children: [
              { index: true, lazy: async () => {return {Component: PlatformDashboard};} },
              { path: 'tenants', lazy: async () => {return {Component: TenantsPage};} },
            ],
          },
        ],
      },
    ],
  },
]);
