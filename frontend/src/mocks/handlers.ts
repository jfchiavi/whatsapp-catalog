import { http, HttpResponse } from 'msw';
import { mockData } from './data';
import type {CreateSaleBody} from '../types/sales';

export const handlers = [
// Auth
http.post('/api/auth/login', async ({ request }) => {
  const body = (await request.json()) as {
    email: string;
    password?: string;
  };

  const { email } = body;
    const user = mockData.users.find(u => u.email === email);


    if (!user) {
        return HttpResponse.json({ message: 'Credenciales inválidas crack' }, { status: 401 });
    }

    return HttpResponse.json({
    user,
    token: 'mock-jwt-token',
    });
}),


// Products
http.get('/api/products', () => {
return HttpResponse.json(mockData.products);
}),


// Stock
http.get('/api/stock/product/:id', ({ params }) => {
    const product = mockData.products.find(p => p.id === params.id);
    if (!product) return HttpResponse.json([], { status: 404 });

    const stock = Object.entries(product.stock).map(([branchId, quantity]) => ({
        branchId,
        quantity,
        minQuantity: product.minStock?.[branchId],
    }));

    return HttpResponse.json(stock);
}),


// Sales
http.post('/api/sales', async ({ request }) => {
    const sale = await request.json() as CreateSaleBody;
    return HttpResponse.json({...sale,
    id: `sale-${Date.now()}`,
    });
}),


// WhatsApp Orders
http.get('/api/whatsapp/orders', () => {
    return HttpResponse.json(mockData.whatsappOrders);
}),
];