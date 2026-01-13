import {api} from './api';
import { mockData } from '@/mocks/data';

import type {
  SalesReportItem,
  ProductReportItem,
  InventoryReportItem,
  BranchComparisonItem,
} from '@/types/reports';

/**
 * Reporte de ventas por período
 */
export const fetchSalesReport = async (
  from: Date,
  to: Date
): Promise<SalesReportItem[]> => {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    // mock simple
    return [
      { date: '2026-01-01' , totalSales: 3, totalAmount: 300 },
      { date: '2026-01-31', totalSales: 5, totalAmount: 650 },
    ];
  }

  const { data } = await api.get('/reports/sales', {
    params: { from, to },
  });

  return data;
};

/**
 * Productos más vendidos
 */
export const fetchProductsReport = async (): Promise<ProductReportItem[]> => {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    return mockData.products.map(p => ({
      productId: p.id,
      name: p.name,
      quantitySold: 10,
      totalRevenue: 10 * p.price,
    }));
  }

  const { data } = await api.get('/reports/products');
  console.log('Product Report Data:', data);
  return data;
};

/**
 * Valorización de inventario
 */
export const fetchInventoryReport = async (): Promise<InventoryReportItem[]> => {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    return mockData.products.map(p => {
      const totalStock = Object.values(p.stock).reduce(
        (acc, qty) => acc + qty,
        0
      );

      return {
        productId: p.id,
        name: p.name,
        totalStock,
        inventoryValue: totalStock * p.cost,
      };
    });
  }

  const { data } = await api.get('/reports/inventory');
  return data;
};

/**
 * Comparativa por sucursal
 */
export const fetchBranchComparison =
  async (): Promise<BranchComparisonItem[]> => {
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
      return mockData.branches.map(b => ({
        branchId: b.id,
        branchName: b.name,
        totalSales: 12,
        totalAmount: 1200,
      }));
    }

    const { data } = await api.get('/reports/branches');
    return data;
  };
