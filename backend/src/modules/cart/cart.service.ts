import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { applyDiscounts } from '@/modules/discounts/discounts.service';
import { findOrCreateCustomer } from '@/modules/customers/customers.service';

const CART_EXPIRY_HOURS = 24;

const cartInclude = {
  items: {
    include: {
      variant: {
        include: { product: true },
      },
    },
  },
  branch: {
    include: { tenant: true },
  },
} as const;

export const getOrCreateCart = async (tenantId: string, sessionId: string) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CART_EXPIRY_HOURS * 60 * 60 * 1000);

  const activeCart = await prisma.cart.findFirst({
    where: {
      tenantId,
      sessionId,
      status: 'active',
      expiresAt: { gt: now },
    },
    include: cartInclude,
  });

  if (activeCart) return activeCart;

  const existing = await prisma.cart.findFirst({
    where: { tenantId, sessionId },
    include: cartInclude,
  });

  // Carrito existente que expiró pero sigue "active": se reactiva
  // conservando sus items (mismo (tenantId, sessionId), sin violar la unique).
  if (existing && existing.status === 'active') {
    return prisma.cart.update({
      where: { id: existing.id },
      data: { status: 'active', expiresAt },
      include: cartInclude,
    });
  }

  // Carts enviados/abandonados ocupan la unique (tenantId, sessionId):
  // se eliminan para poder crear el carrito nuevo del visitante.
  if (existing) {
    await prisma.cart.delete({ where: { id: existing.id } });
  }

  try {
    return await prisma.cart.create({
      data: {
        tenantId,
        sessionId,
        status: 'active',
        expiresAt,
      },
      include: cartInclude,
    });
  } catch (error) {
    // Carrera concurrente: otro request creó el mismo carrito; devolver el existente.
    const raced = await prisma.cart.findFirst({
      where: { tenantId, sessionId },
      include: cartInclude,
    });
    if (raced) return raced;
    throw error;
  }
};

export const addToCart = async (
  tenantId: string,
  cartId: string,
  variantId: string,
  quantity: number
) => {
  const cart = await prisma.cart.findFirst({
    where: { id: cartId, tenantId, status: 'active' },
  });

  if (!cart) {
    throw new AppError('Cart not found or expired', 404, 'NOT_FOUND');
  }

  const variant = await prisma.variant.findFirst({
    where: { id: variantId, tenantId },
    include: { product: true },
  });

  if (!variant || !variant.product.active) {
    throw new AppError('Variant not found or inactive', 404, 'NOT_FOUND');
  }

  if (cart.branchId) {
    const stock = await prisma.stock.findUnique({
      where: {
        tenantId_variantId_branchId: {
          tenantId,
          variantId,
          branchId: cart.branchId,
        },
      },
    });

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId, variantId, tenantId },
    });

    const currentQty = existingItem?.quantity ?? 0;
    const totalQty = currentQty + quantity;

    if (!stock || stock.quantity < totalQty) {
      throw new AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK');
    }
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: { cartId, variantId, tenantId },
  });

  if (existingItem) {
    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
      include: { variant: { include: { product: true } } },
    });
  }

  return prisma.cartItem.create({
    data: {
      cartId,
      variantId,
      quantity,
      unitPriceSnapshot: variant.price,
      tenantId,
    },
    include: { variant: { include: { product: true } } },
  });
};

export const updateCartItem = async (
  tenantId: string,
  cartId: string,
  itemId: string,
  quantity: number
) => {
  const cart = await prisma.cart.findFirst({
    where: { id: cartId, tenantId, status: 'active' },
  });

  if (!cart) {
    throw new AppError('Cart not found or expired', 404, 'NOT_FOUND');
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId, tenantId },
  });

  if (!item) {
    throw new AppError('Cart item not found', 404, 'NOT_FOUND');
  }

  if (quantity === 0) {
    return prisma.cartItem.delete({ where: { id: itemId } });
  }

  if (cart.branchId) {
    const stock = await prisma.stock.findUnique({
      where: {
        tenantId_variantId_branchId: {
          tenantId,
          variantId: item.variantId,
          branchId: cart.branchId,
        },
      },
    });

    if (!stock || stock.quantity < quantity) {
      throw new AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK');
    }
  }

  return prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
    include: { variant: { include: { product: true } } },
  });
};

export const removeCartItem = async (
  tenantId: string,
  cartId: string,
  itemId: string
) => {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId, tenantId },
  });

  if (!item) {
    throw new AppError('Cart item not found', 404, 'NOT_FOUND');
  }

  return prisma.cartItem.delete({ where: { id: itemId } });
};

export const setCartBranch = async (
  tenantId: string,
  cartId: string,
  branchId: string
) => {
  const cart = await prisma.cart.findFirst({
    where: { id: cartId, tenantId, status: 'active' },
  });

  if (!cart) {
    throw new AppError('Cart not found or expired', 404, 'NOT_FOUND');
  }

  const branch = await prisma.branch.findFirst({
    where: { id: branchId, tenantId, active: true },
  });

  if (!branch) {
    throw new AppError('Branch not found', 404, 'NOT_FOUND');
  }

  const items = await prisma.cartItem.findMany({
    where: { cartId, tenantId },
  });

  for (const item of items) {
    const stock = await prisma.stock.findUnique({
      where: {
        tenantId_variantId_branchId: {
          tenantId,
          variantId: item.variantId,
          branchId,
        },
      },
    });

    if (!stock || stock.quantity < item.quantity) {
      throw new AppError(
        `Insufficient stock for variant ${item.variantId} in selected branch`,
        400,
        'INSUFFICIENT_STOCK'
      );
    }
  }

  return prisma.cart.update({
    where: { id: cartId },
    data: { branchId },
    include: {
      items: {
        include: {
          variant: { include: { product: true } },
        },
      },
      branch: true,
    },
  });
};

export const submitCart = async (
  tenantId: string,
  cartId: string,
  customerName: string,
  customerPhone: string,
  customerNotes?: string
) => {
  const cart = await prisma.cart.findFirst({
    where: { id: cartId, tenantId, status: 'active' },
    include: {
      items: {
        include: {
          variant: { include: { product: true } },
        },
      },
      branch: {
        include: { tenant: true },
      },
    },
  });

  if (!cart) {
    throw new AppError('Cart not found or expired', 404, 'NOT_FOUND');
  }

  if (!cart.branchId) {
    throw new AppError('Please select a branch before checkout', 400, 'BRANCH_REQUIRED');
  }

  if (cart.items.length === 0) {
    throw new AppError('Cart is empty', 400, 'EMPTY_CART');
  }

  let representative = await prisma.user.findFirst({
    where: {
      tenantId,
      branchId: cart.branchId,
      role: 'BRANCH_MANAGER',
      active: true,
    },
  });

  if (!representative) {
    representative = await prisma.user.findFirst({
      where: {
        tenantId,
        role: 'ADMIN',
        active: true,
      },
    });
  }

  const pricing = await applyDiscounts(
    tenantId,
    cart.items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPriceSnapshot,
    }))
  );

  const customer = await findOrCreateCustomer(tenantId, {
    name: customerName,
    phone: customerPhone,
    notes: customerNotes ?? null,
  });

  const total = pricing.total;

  const messageText = buildOrderMessage(cart, customerName, customerNotes, pricing);
  const whatsappNumber = cart.branch?.tenant?.whatsappNumber || '5491112345678';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(messageText)}`;

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        tenantId,
        cartId: cart.id,
        branchId: cart.branchId!,
        customerId: customer.id,
        representativeId: representative?.id || null,
        customerName,
        customerPhone,
        customerNotes: customerNotes || null,
        status: 'pending',
        totalSnapshot: total,
        whatsappMessage: messageText,
        whatsappUrl,
        items: {
          create: cart.items.map((cartItem, index) => ({
            variantId: cartItem.variantId,
            quantity: cartItem.quantity,
            unitPriceSnapshot: pricing.items[index].unitPriceAfterDiscount,
            skuSnapshot: cartItem.variant.sku,
            attributesSnapshot: cartItem.variant.attributes as Record<string, string>,
            tenantId,
          })),
        },
      },
      include: {
        items: {
          include: {
            variant: { include: { product: true } },
          },
        },
        branch: true,
      },
    });

    await tx.cart.update({
      where: { id: cartId },
      data: { status: 'submitted' },
    });

    return order;
  });
};

function buildOrderMessage(
  cart: {
    items: {
      quantity: number;
      unitPriceSnapshot: number;
      variant: {
        sku: string;
        attributes: unknown;
        product: { name: string };
      };
    }[];
    branch?: { name: string } | null;
  },
  customerName: string,
  customerNotes: string | undefined,
  pricing: {
    items: {
      lineTotal: number;
      unitPriceAfterDiscount: number;
      discount: { name: string } | null;
    }[];
    subtotal: number;
    discountTotal: number;
    total: number;
  }
): string {
  const itemsText = cart.items
    .map((item, index) => {
      const priced = pricing.items[index];
      const discountLine = priced.discount ? `\nDescuento: ${priced.discount.name}` : '';
      return `📦 ${item.variant.product.name} (${Object.entries(item.variant.attributes as Record<string, string>)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')})
SKU: ${item.variant.sku}
Cantidad: ${item.quantity}${discountLine}
Subtotal: $${priced.lineTotal.toFixed(2)}`;
    })
    .join('\n\n');

  const totalsLines =
    pricing.discountTotal > 0
      ? `Subtotal: $${pricing.subtotal.toFixed(2)}\nDescuento: -$${pricing.discountTotal.toFixed(2)}\nTotal: $${pricing.total.toFixed(2)}`
      : `Total: $${pricing.total.toFixed(2)}`;

  let message = `Hola! Soy ${customerName} y quiero comprar:\n\n${itemsText}\n\n${totalsLines}`;

  if (cart.branch) {
    message += `\n\nSucursal: ${cart.branch.name}`;
  }

  if (customerNotes) {
    message += `\n\nNotas: ${customerNotes}`;
  }

  return message;
}
