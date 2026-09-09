export interface Variant {
  id: string;
  tenantId: string;
  productId: string;
  sku: string;
  price: number;
  cost: number;
  attributes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  imageUrl: string | null;
  batch: string | null;
  expirationDate: string | null;
  baseAttributes: Record<string, unknown>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  variants: Variant[];
}

export type CreateProductInput = {
  name: string;
  imageUrl?: string;
  batch?: string;
  expirationDate?: string;
  baseAttributes?: Record<string, unknown>;
  active?: boolean;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export type CreateVariantInput = {
  sku: string;
  price: number;
  cost: number;
  attributes?: Record<string, unknown>;
};

export type UpdateVariantInput = Partial<CreateVariantInput>;
