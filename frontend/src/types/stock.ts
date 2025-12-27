export type BranchType = 'physical' | 'virtual';


export interface Branch {
    id: string;
    name: string;
    type: BranchType;
    stockMinThreshold: number;
}


export interface StockByBranch {
    branchId: string;
    quantity: number;
    minQuantity?: number;
}


export interface StockMovement {
    id: string;
    productId: string;
    fromBranchId?: string;
    toBranchId?: string;
    quantity: number;
    reason: 'sale' | 'transfer' | 'adjustment' | 'replenish-web';
    createdAt: string;
    createdBy: string;
}