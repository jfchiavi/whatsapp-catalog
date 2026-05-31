export interface SalesReportItem {
  date: string;
  totalSales: number;
  totalAmount: number;
}

export interface ProductReportItem {
  productId: string;
  name: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface InventoryReportItem {
  productId: string;
  name: string;
  totalStock: number;
  inventoryValue: number;
}

export interface BranchComparisonItem {
  branchId: string;
  branchName: string;
  totalSales: number;
  totalAmount: number;
}
