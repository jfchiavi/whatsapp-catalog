import axios from 'axios';
import { mockData } from '../mocks/data';

import type {
  SalesReportItem,
  ProductReportItem,
  InventoryReportItem,
  BranchComparisonItem,
} from '../types/reports';

/**
 * Reporte de ventas por período
 */
export const fetchSalesReport = async (
  from: string,
  to: string
): Promise<SalesReportItem[]> => {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    // mock simple
    return [
      { date: from, totalSales: 3, totalRevenue: 300 },
      { date: to, totalSales: 5, totalRevenue: 650 },
    ];
  }

  const { data } = await axios.get('/api/reports/sales', {
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
      revenue: 10 * p.price,
    }));
  }

  const { data } = await axios.get('/api/reports/products');
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
        valuation: totalStock * p.cost,
      };
    });
  }

  const { data } = await axios.get('/api/reports/inventory');
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
        revenue: 1200,
      }));
    }

    const { data } = await axios.get('/api/reports/branches');
    return data;
  };
