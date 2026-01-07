// src/mocks/data.ts

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

export const mockData : {
  users: any[];
  branches: any[];
  products: MockProduct[];
  products2: MockProduct2[];
  whatsappOrders: any[];
} = {
  users: [
    {
      id: '1',
      email: 'admin@tienda.com',
      name: 'Admin Principal',
      role: 'super_admin',
      branchId: null,
    },
  ],

  branches: [
    {
      id: 'branch-web',
      name: 'Tienda Web Virtual',
      type: 'virtual',
      stockMinThreshold: 20,
    },
    {
      id: 'branch-central',
      name: 'Sucursal Central',
      type: 'physical',
      stockMinThreshold: 5,
    },
  ],

  products: [
    {
      id: 'prod-001',
      sku: 'SKU-001',
      name: 'Producto Demo',
      price: 100,
      cost: 60,
      stock: {
        'branch-web': 15,
        'branch-central': 25,
      },
      minStock: {
        'branch-web': 20,
        'branch-central': 5,
      },
    },
  ],
  products2: [
    {
      id: 'prod-001',
      sku: 'SKU-001',
      name: 'Producto Demo',
      price: 100,
      cost: 60,
      active: true,
      createdAt: new Date().toISOString(),
    },
  ],
  whatsappOrders: [
    {
      id: 'wa-001',
      customerName: 'Juan Pérez',
      customerPhone: '+5491122334455',
      message: 'Hola, quiero comprar 1 producto demo',
      items: [{ productId: 'prod-001', name: 'Producto Demo', quantity: 1 }],
      total: 100,
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ],
};
