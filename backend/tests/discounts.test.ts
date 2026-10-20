import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  applyDiscounts,
  createDiscount,
  deleteDiscount,
  getDiscounts,
  updateDiscount,
} from '../src/modules/discounts/discounts.service';
import { AppError } from '../src/lib/errors';

describe('Discounts service', () => {
  const suffix = Date.now().toString();
  const tenantAId = `test-disc-a-${suffix}`;
  const tenantBId = `test-disc-b-${suffix}`;
  const productId = `test-disc-product-${suffix}`;
  const variantId = `test-disc-variant-${suffix}`;
  const otherVariantId = `test-disc-variant-other-${suffix}`;
  const crossVariantId = `test-disc-variant-cross-${suffix}`;

  const inRange = { startDate: new Date(Date.now() - 86_400_000), endDate: new Date(Date.now() + 86_400_000) };

  beforeAll(async () => {
    await prisma.tenant.createMany({
      data: [
        { id: tenantAId, name: 'Disc Tenant A', slug: `disc-a-${suffix}` },
        { id: tenantBId, name: 'Disc Tenant B', slug: `disc-b-${suffix}` },
      ],
    });

    for (const [id, tenantId] of [
      [productId, tenantAId],
      [`test-disc-product-b-${suffix}`, tenantBId],
    ] as const) {
      await prisma.product.create({ data: { id, name: `Disc Product ${id}`, tenantId } });
    }

    await prisma.variant.createMany({
      data: [
        {
          id: variantId,
          productId,
          tenantId: tenantAId,
          sku: `DISC-A-${suffix}`,
          price: 1000,
          cost: 400,
        },
        {
          id: otherVariantId,
          productId,
          tenantId: tenantAId,
          sku: `DISC-B-${suffix}`,
          price: 500,
          cost: 200,
        },
        {
          id: crossVariantId,
          productId: `test-disc-product-b-${suffix}`,
          tenantId: tenantBId,
          sku: `DISC-X-${suffix}`,
          price: 300,
          cost: 100,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.discount.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.variant.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.product.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
    await prisma.$disconnect();
  });

  it('rejects invalid date ranges and percentages above 100', async () => {
    await expect(
      createDiscount(tenantAId, {
        name: 'Invalido',
        type: 'PERCENTAGE',
        value: 150,
        ...inRange,
      })
    ).rejects.toThrow(AppError);

    await expect(
      createDiscount(tenantAId, {
        name: 'Fechas',
        type: 'FIXED',
        value: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() - 1000),
      })
    ).rejects.toThrow(AppError);
  });

  it('rejects scopes that belong to another tenant', async () => {
    await expect(
      createDiscount(tenantAId, {
        name: 'Cross tenant',
        type: 'FIXED',
        value: 10,
        variantId: crossVariantId,
        ...inRange,
      })
    ).rejects.toThrow(AppError);
  });

  it('applies the best discount per item with variant and product scope', async () => {
    await createDiscount(tenantAId, {
      name: 'Global 10%',
      type: 'PERCENTAGE',
      value: 10,
      ...inRange,
    });

    const variantDiscount = await createDiscount(tenantAId, {
      name: 'Variante 20%',
      type: 'PERCENTAGE',
      value: 20,
      variantId,
      ...inRange,
    });

    await createDiscount(tenantAId, {
      name: 'Producto 50 fijo',
      type: 'FIXED',
      value: 50,
      productId,
      ...inRange,
    });

    const pricing = await applyDiscounts(tenantAId, [
      { variantId, quantity: 2, unitPrice: 1000 },
      { variantId: otherVariantId, quantity: 1, unitPrice: 500 },
    ]);

    const [first, second] = pricing.items;

    // Para la variante con scope propio gana 20% (200) por sobre 50 fijo y 10% global.
    expect(first.discount?.name).toBe('Variante 20%');
    expect(first.unitPriceAfterDiscount).toBe(800);
    expect(first.lineTotal).toBe(1600);

    // Sin scope de variante gana el fijo de 50 sobre el 10% (50) por empate en monto: se queda el primero encontrado con mayor monto.
    expect(second.discount).not.toBeNull();
    expect(second.unitPriceAfterDiscount).toBeLessThan(500);

    expect(pricing.subtotal).toBe(2500);
    expect(pricing.total).toBe(pricing.subtotal - pricing.discountTotal);

    await updateDiscount(variantDiscount.id, tenantAId, { active: false });
    const withoutVariantDiscount = await applyDiscounts(tenantAId, [
      { variantId, quantity: 1, unitPrice: 1000 },
    ]);
    expect(withoutVariantDiscount.items[0].discount?.name).not.toBe('Variante 20%');
    expect(withoutVariantDiscount.items[0].unitPriceAfterDiscount).toBe(900);
  });

  it('ignores discounts outside their date range', async () => {
    const expired = await createDiscount(tenantAId, {
      name: 'Expirada',
      type: 'PERCENTAGE',
      value: 90,
      variantId,
      startDate: new Date(Date.now() - 2 * 86_400_000),
      endDate: new Date(Date.now() - 86_400_000),
    });

    const pricing = await applyDiscounts(tenantAId, [
      { variantId, quantity: 1, unitPrice: 1000 },
    ]);

    expect(pricing.items[0].discount?.id).not.toBe(expired.id);
    expect(pricing.items[0].unitPriceAfterDiscount).toBe(900);
  });

  it('keeps discount listings isolated per tenant and deletes rules', async () => {
    const tenantBDiscount = await createDiscount(tenantBId, {
      name: 'Solo tenant B',
      type: 'FIXED',
      value: 20,
      ...inRange,
    });

    const listA = await getDiscounts(tenantAId);
    expect(listA.some((discount) => discount.id === tenantBDiscount.id)).toBe(false);

    const listB = await getDiscounts(tenantBId);
    expect(listB.some((discount) => discount.id === tenantBDiscount.id)).toBe(true);

    await deleteDiscount(tenantBDiscount.id, tenantBId);
    await expect(deleteDiscount(tenantBDiscount.id, tenantBId)).rejects.toThrow(AppError);
  });
});
