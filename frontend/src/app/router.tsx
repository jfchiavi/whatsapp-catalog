import { createBrowserRouter } from "react-router-dom";
import Home from "./routes/web/Home";
import ProductDetail from "./routes/web/ProductDetail";
import SearchResults from "./routes/web/SearchResults";
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/dashboard/auth/ProtectedRoute';
import LoginPage  from '@/features/auth/LoginPage';
import HomeDashBoard from '@/features/dashboard/Home';
import ProductsPage from '@/features/products/ProductsPage';
import StockPage from '@/features/stock/StockPage';
import SalesPage from '@/features/sales/SalesPage';
import ReportsPage from '@/features/reports/ReportsPage';
import ErrorPage from '@/components/dashboard/layout/ErrorPage';

export const router = createBrowserRouter([
  //Rutas de la Web publica e-comerce
  { path: "/", element: <Home /> },
  { path: "/product/:id", element: <ProductDetail /> },
  { path: "/search", element: <SearchResults /> },
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
          { path: '/dashboard', lazy:async () => {return {Component: HomeDashBoard};} },
          { path: '/products', lazy: async () => {return {Component: ProductsPage}; }},
          { path: '/stock', lazy: async () => {return {Component: StockPage }}},
          { path: '/sales', lazy: async () => {return {Component: SalesPage }} },
          { path: '/reports', lazy: async () => {return {Component: ReportsPage }}},
        ],
      },
    ],
  },
]);
