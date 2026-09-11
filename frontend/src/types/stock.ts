export type BranchType = 'physical' | 'virtual';

export interface Branch {
  id: string;
  name: string;
  type: BranchType;
  address?: string;
  hours?: string;
  active: boolean;
  tenantId: string;
  createdAt: string;
}

export interface StockByBranch {
  id: string;
  variantId: string;
  branchId: string;
  quantity: number;
  tenantId: string;
  variant: {
    id: string;
    sku: string;
    price: number;
    cost: number;
    attributes: Record<string, string>;
    product: {
      id: string;
      name: string;
      imageUrl?: string;
      batch?: string;
      expirationDate?: string;
      baseAttributes?: Record<string, string>;
      active: boolean;
    };
  };
}

export interface StockMovement {
  id: string;
  variantId: string;
  fromBranchId?: string;
  toBranchId?: string;
  quantity: number;
  receivedQuantity?: number;
  type: 'ADJUST' | 'TRANSFER' | 'SALE';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  userId?: string;
  tenantId: string;
  createdAt: string;
  variant: {
    id: string;
    sku: string;
    product: { name: string };
  };
  fromBranch?: { id: string; name: string };
  toBranch?: { id: string; name: string };
  user?: { id: string; name: string };
}
