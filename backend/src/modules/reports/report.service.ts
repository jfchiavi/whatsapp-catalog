import { prisma } from '@/lib/prisma';
import {
  SalesReportItem,
  ProductReportItem,
  InventoryReportItem,
  BranchComparisonItem,
} from '@/types/reports';

/**
 * Ventas por período
 */
export const getSalesReport = async (
  from: Date,
  to: Date
): Promise<SalesReportItem[]> => {
  return prisma.$queryRaw<SalesReportItem[]>`
    SELECT
      DATE(s."createdAt") as date,
      COUNT(s.id)::int as "totalSales",
      SUM(s.total)::float as "totalAmount"
    FROM "Sale" s
    WHERE s."createdAt" BETWEEN ${from} AND ${to}
    GROUP BY DATE(s."createdAt")
    ORDER BY date ASC
  `;
};

/**
 * Productos más vendidos
 */
export const getProductsReport =
  async (): Promise<ProductReportItem[]> => {
    return prisma.$queryRaw<ProductReportItem[]>`
      SELECT
        p.id as "productId",
        p.name,
        SUM(si.quantity)::int as "quantitySold",
        SUM(si.quantity * p.price)::float as "totalRevenue"
      FROM "SaleItem" si
      JOIN "Product" p ON p.id = si."productId"
      GROUP BY p.id, p.name
      ORDER BY "quantitySold" DESC
    `;
  };

/**
 * Valorización de inventario
 */
export const getInventoryReport =
  async (): Promise<InventoryReportItem[]> => {
    return prisma.$queryRaw<InventoryReportItem[]>`
      SELECT
        p.id as "productId",
        p.name,
        SUM(s.quantity)::int as "totalStock",
        SUM(s.quantity * p.cost)::float as "inventoryValue"
      FROM "Stock" s
      JOIN "Product" p ON p.id = s."productId"
      GROUP BY p.id, p.name
      ORDER BY p.name ASC
    `;
  };

/**
 * Comparativa por sucursal
 */
export const getBranchComparison =
  async (): Promise<BranchComparisonItem[]> => {
    return prisma.$queryRaw<BranchComparisonItem[]>`
      SELECT
        b.id as "branchId",
        b.name as "branchName",
        COUNT(s.id)::int as "totalSales",
        SUM(s.total)::float as "totalAmount"
      FROM "Sale" s
      JOIN "Branch" b ON b.id = s."branchId"
      GROUP BY b.id, b.name
      ORDER BY "totalAmount" DESC
    `;
  };
