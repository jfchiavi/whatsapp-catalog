// Prisma type augmentation for JSON fields
// This file augments the generated Prisma client types to provide stricter types for JSON fields

import { Prisma } from './generated/prisma-client';
import { BaseAttributes, VariantAttributes } from './types/json';

// Augment Product's baseAttributes field
declare namespace Prisma {
  export type ProductGetPayload<
    S extends boolean | null | undefined | Prisma.ProductDefaultArgs
  > = Prisma.GetProductReturnType<S> & {
    baseAttributes: BaseAttributes;
  };

  export type VariantGetPayload<
    S extends boolean | null | undefined | Prisma.VariantDefaultArgs
  > = Prisma.GetVariantReturnType<S> & {
    attributes: VariantAttributes;
  };
}

// Also update the input types for creation/update if needed
// For example, when creating a Product, we want to ensure baseAttributes matches BaseAttributes
export type ProductCreateInput = Prisma.ProductCreateInput & {
  baseAttributes?: BaseAttributes;
};

export type ProductUpdateInput = Prisma.ProductUpdateInput & {
  baseAttributes?: BaseAttributes;
};

export type VariantCreateInput = Prisma.VariantCreateInput & {
  attributes?: VariantAttributes;
};

export type VariantUpdateInput = Prisma.VariantUpdateInput & {
  attributes?: VariantAttributes;
};