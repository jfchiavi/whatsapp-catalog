// Ventas por período
export interface SalesReportItem {
  date: string;          // YYYY-MM-DD
  totalSales: number;    // cantidad de ventas
  totalRevenue: number;  // monto total
}

// Productos más vendidos
export interface ProductReportItem {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

// Valorización de inventario
export interface InventoryReportItem {
  productId: string;
  name: string;
  totalStock: number;
  valuation: number;
}

// Comparativa por sucursal
export interface BranchComparisonItem {
  branchId: string;
  branchName: string;
  totalSales: number;
  revenue: number;
}
