import { createBrowserRouter } from "react-router-dom";
import Home from "./routes/web/Home";
import ProductDetail from "./routes/web/ProductDetail";
import SearchResults from "./routes/web/SearchResults";
import TenantCatalog from "./routes/web/TenantCatalog";
import TenantProductDetail from "./routes/web/TenantProductDetail";
import Marketplace from "./routes/web/Marketplace";
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
import ErrorPage from '@/components/dashboard/layout/ErrorPage';

export const router = createBrowserRouter([
  // Marketplace global (dominio raíz)
  { path: "/", element: <Marketplace /> },

  // Catálogo por tenant (subdominio o dominio custom)
  { path: "/t/:tenantSlug", element: <TenantCatalog /> },
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
            ],
          },
          { path: '/products', lazy: async () => {return {Component: ProductsPage}; }},
          { path: '/stock', lazy: async () => {return {Component: StockPage }}},
          { path: '/sales', lazy: async () => {return {Component: SalesListPage }} },
          { path: '/sales/new', lazy: async () => {return {Component: CreateSalePage }} },
          //TODO: /sales/:id       → SaleDetailPage (opcional)
          { path: '/reports', lazy: async () => {return {Component: ReportsPage }}},
        ],
      },
    ],
  },
]);
