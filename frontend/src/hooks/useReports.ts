import { useQuery } from '@tanstack/react-query';
import {
  fetchSalesReport,
  fetchProductsReport,
  fetchInventoryReport,
  fetchBranchComparison,
} from '@/services/reports.api';

import type {
  SalesReportItem,
  ProductReportItem,
  InventoryReportItem,
  BranchComparisonItem,
} from '@/types/reports';

/**
 * Ventas por período
 */
export const useSalesReport = (from: Date, to: Date) =>
  useQuery<SalesReportItem[]>({
    queryKey: ['reports', 'sales', from, to],
    queryFn: () => fetchSalesReport(from, to),
  });

/**
 * Productos más vendidos
 */
export const useProductsReport = () =>
  useQuery<ProductReportItem[]>({
    queryKey: ['reports', 'products'],
    queryFn: fetchProductsReport,
  });

/**
 * Valorización de inventario
 */
export const useInventoryReport = () =>
  useQuery<InventoryReportItem[]>({
    queryKey: ['reports', 'inventory'],
    queryFn: fetchInventoryReport,
  });

/**
 * Comparativa por sucursal
 */
export const useBranchComparison = () =>
  useQuery<BranchComparisonItem[]>({
    queryKey: ['reports', 'branches'],
    queryFn: fetchBranchComparison,
  });
