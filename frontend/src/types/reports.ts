// Ventas por período
export interface SalesReportItem {
  date: string;          // YYYY-MM-DD
  totalSales: number;    // cantidad de ventas
  totalAmount: number;  // monto total
}

// Productos más vendidos
export interface ProductReportItem {
  productId: string;
  name: string;
  quantitySold: number;
  totalRevenue: number;
}

// Valorización de inventario
export interface InventoryReportItem {
  productId: string;
  name: string;
  totalStock: number;
  inventoryValue: number;
}

// Comparativa por sucursal
export interface BranchComparisonItem {
  branchId: string;
  branchName: string;
  totalSales: number;
  totalAmount: number;
}
