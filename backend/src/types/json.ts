// Types for JSON attributes in Product and Variant models

/** Base attributes shared across all rubros (stored in Product.baseAttributes) */
export interface BaseAttributes {
  // Example: meters per box for construction materials
  metrosPorCaja?: number;
  // Add other shared technical data as needed
  [key: string]: unknown;
}

/** Attributes specific to construction rubro */
export interface ConstructionAttributes {
  // Example: thickness in mm
  espesor?: number;
  // Example: material type
  material?: string;
  // Example: size dimensions
  dimensiones?: {
    largo?: number;
    ancho?: number;
    alto?: number;
  };
  [key: string]: unknown;
}

/** Attributes specific to clothing rubro */
export interface ClothingAttributes {
  // Example: color
  color?: string;
  // Example: size
  talle?: string;
  // Example: material
  material?: string;
  // Example: gender
  genero?: string;
  [key: string]: unknown;
}

/** Attributes specific to electronics rubro */
export interface ElectronicsAttributes {
  // Example: voltage
  voltaje?: number;
  // Example: power in watts
  potencia?: number;
  // Example: brand
  marca?: string;
  // Example: model
  modelo?: string;
  [key: string]: unknown;
}

/** Union type for possible variant attributes */
export type VariantAttributes = 
  | ConstructionAttributes
  | ClothingAttributes
  | ElectronicsAttributes
  | { [key: string]: unknown }; // fallback for unknown rubros

/** Union type for possible base attributes */
export type BaseAttributesType = BaseAttributes & { [key: string]: unknown };