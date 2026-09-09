// src/mocks/data.ts

// Seed UUIDs from seed-docker.sql
export const SEED_IDS = {
  tenant: '0b95f160-f948-5ac3-921a-56029e130fa9',
  branchCentral: '1075ea0b-a199-5f89-ad10-bcb83627b8a6',
  branchWeb: 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a',
  userAdmin: '3446d34c-deb5-58ef-8822-2b94fb6f5842',
  userManager: '8e188ee8-0bdf-55b0-abb3-1deb8d6f2da0',
  userSeller: '46b4faa7-e0bd-510f-bc69-a0270b7eb450',
  productTshirt: '0aa15edc-d718-5385-9e43-75b42902d59e',
  productJeans: '8e17f68d-69a8-5824-af57-7c1b830e414c',
  productSneakers: 'fe121631-6d0c-5cf2-b4d1-b72e3c40d4b0',
  variantTshirtRedS: 'a9fbfe58-6361-557b-90c0-7dadf311090d',
  variantTshirtRedM: '40bff466-6107-58ea-af9a-ebb91ec2034a',
  variantTshirtRedL: '009e6cf9-52ba-56ad-97a9-2488a266d5f9',
  variantJeans38: '7ce11874-16d9-55a8-ab96-149f2c546805',
  variantJeans42: 'fd3167b2-8250-5827-92b3-27e96f253688',
  variantSneakers40: 'a6e9f87c-5fad-52ba-9645-5b5d6a412c06',
  variantSneakers41: 'd744183c-949e-51f8-b591-33954650b06e',
  variantSneakers42: 'b89af82f-82be-5268-abbd-2c7f9efb4c7f',
  waOrder1: 'ee65a3bb-0547-5354-a0a2-77e87d4669a1',
  waOrder2: '50c822ef-0e8e-5ddb-90fe-acfa5d22ed0f',
} as const;

export interface MockProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  cost: number;
  stock: Record<string, number>;
  minStock?: Record<string, number>;
}

export interface MockProduct2 {
  id: string;
  sku: string;
  name: string;
  price: number;
  cost: number;
  active: boolean;
  createdAt: string;
}

export const mockData: {
  users: any[];
  branches: any[];
  products: MockProduct[];
  products2: MockProduct2[];
  whatsappOrders: any[];
} = {
  users: [
    {
      id: SEED_IDS.userAdmin,
      email: 'admin@demo.com',
      name: 'Admin Demo',
      role: 'SUPER_ADMIN',
      branchId: null,
    },
  ],

  branches: [
    {
      id: SEED_IDS.branchWeb,
      name: 'Tienda Online',
      type: 'virtual',
      stockMinThreshold: 20,
    },
    {
      id: SEED_IDS.branchCentral,
      name: 'Sucursal Central',
      type: 'physical',
      stockMinThreshold: 5,
    },
  ],

  products: [
    {
      id: SEED_IDS.productTshirt,
      sku: 'REM-NEG-M',
      name: 'Remera Oversize',
      price: 8500,
      cost: 5000,
      stock: {
        [SEED_IDS.branchWeb]: 100,
        [SEED_IDS.branchCentral]: 25,
      },
      minStock: {
        [SEED_IDS.branchWeb]: 20,
        [SEED_IDS.branchCentral]: 5,
      },
    },
  ],
  products2: [
    {
      id: SEED_IDS.productTshirt,
      sku: 'REM-NEG-M',
      name: 'Remera Oversize',
      price: 8500,
      cost: 5000,
      active: true,
      createdAt: new Date().toISOString(),
    },
  ],
  whatsappOrders: [
    {
      id: SEED_IDS.waOrder1,
      customerName: 'Juan Pérez',
      customerPhone: '+5491112345678',
      message: 'Hola! Quiero comprar 2 Remeras Talle M y 1 Jean Talle 38. ¿Tienen stock?',
      items: [
        { productId: SEED_IDS.productTshirt, name: 'Remera Oversize', quantity: 2 },
        { productId: SEED_IDS.productJeans, name: 'Pantalón Jean Slim', quantity: 1 },
      ],
      total: 23500,
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ],
};
