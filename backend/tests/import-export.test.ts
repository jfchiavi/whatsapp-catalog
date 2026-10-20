import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  exportProducts,
  exportSales,
  importProducts,
  importStock,
  parseCSV,
  toCSV,
} from '../src/modules/import-export/import-export.service';
import { AppError } from '../src/lib/errors';

describe('Import/Export service', () => {
  const suffix = Date.now().toString();
  const tenantAId = `test-imp-a-${suffix}`;
  const branchId = `test-imp-branch-${suffix}`;
  const userId = `test-imp-user-${suffix}`;

  beforeAll(async () => {
    await prisma.tenant.create({
      data: { id: tenantAId, name: 'Import Tenant', slug: `imp-a-${suffix}` },
    });
    await prisma.user.create({
      data: {
        id: userId,
        name: 'Import User',
        email: `imp-${suffix}@test.com`,
        password: 'secret-hash',
        role: 'ADMIN',
        tenantId: tenantAId,
      },
    });
    await prisma.branch.create({
      data: { id: branchId, name: 'Import Branch', type: 'physical', tenantId: tenantAId },
    });
  });

  afterAll(async () => {
    await prisma.saleItem.deleteMany({ where: { tenantId: tenantAId } });
    await prisma.sale.deleteMany({ where: { tenantId: tenantAId } });
    await prisma.notification.deleteMany({ where: { tenantId: tenantAId } });
    await prisma.stockMovement.deleteMany({ where: { tenantId: tenantAId } });
    await prisma.stock.deleteMany({ where: { tenantId: tenantAId } });
    await prisma.variant.deleteMany({ where: { tenantId: tenantAId } });
    await prisma.product.deleteMany({ where: { tenantId: tenantAId } });
    await prisma.branch.deleteMany({ where: { tenantId: tenantAId } });
    await prisma.user.deleteMany({ where: { tenantId: tenantAId } });
    await prisma.tenant.deleteMany({ where: { id: tenantAId } });
    await prisma.$disconnect();
  });

  it('parses and serializes CSV with quoted fields', () => {
    const rows = parseCSV('name,sku\n"Remera, manga larga",REM-1\n"Con ""comillas""",REM-2\n');
    expect(rows).toEqual([
      ['name', 'sku'],
      ['Remera, manga larga', 'REM-1'],
      ['Con "comillas"', 'REM-2'],
    ]);

    const csv = toCSV(['name', 'notes'], [['Remera, negra', 'línea\nsegunda']]);
    expect(parseCSV(csv)).toEqual([
      ['name', 'notes'],
      ['Remera, negra', 'línea\nsegunda'],
    ]);
  });

  it('imports products creating variants and updating duplicated skus', async () => {
    const csv = [
      'name,sku,price,cost,attributes',
      `Remera Test,REM-${suffix},100,40,"{""color"":""rojo""}"`,
      `Pantalon Test,PAN-${suffix},200,80,talle=M;color=azul`,
      'Fila mala,,10,5,',
    ].join('\n');

    const summary = await importProducts(tenantAId, csv);

    expect(summary.created).toBe(2);
    expect(summary.updated).toBe(0);
    expect(summary.errors).toHaveLength(1);
    expect(summary.errors[0].row).toBe(4);

    const variant = await prisma.variant.findFirst({
      where: { tenantId: tenantAId, sku: `REM-${suffix}` },
      include: { product: true },
    });
    expect(variant?.price).toBe(100);
    expect(variant?.product.name).toBe('Remera Test');
    expect(variant?.attributes).toEqual({ color: 'rojo' });

    const updateCsv = `name,sku,price,cost\nRemera Test,REM-${suffix},120,40`;
    const updated = await importProducts(tenantAId, updateCsv);
    expect(updated.updated).toBe(1);
    expect(updated.created).toBe(0);

    const reloaded = await prisma.variant.findFirst({
      where: { tenantId: tenantAId, sku: `REM-${suffix}` },
    });
    expect(reloaded?.price).toBe(120);
  });

  it('rejects CSV without the required columns', async () => {
    await expect(importProducts(tenantAId, 'foo,bar\n1,2')).rejects.toThrow(AppError);
  });

  it('imports stock deltas by sku and branch', async () => {
    const csv = `sku,branchId,quantity\nREM-${suffix},${branchId},10\nPAN-${suffix},${branchId},5\nMISSING-${suffix},${branchId},1`;
    const summary = await importStock(tenantAId, csv, userId);

    expect(summary.updated).toBe(2);
    expect(summary.errors).toHaveLength(1);

    const stock = await prisma.stock.findFirst({
      where: { tenantId: tenantAId, branchId },
      include: { variant: true },
    });
    expect(stock).toBeDefined();

    const remStock = await prisma.stock.findFirst({
      where: { tenantId: tenantAId, branchId, variant: { sku: `REM-${suffix}` } },
    });
    expect(remStock?.quantity).toBe(10);

    const movements = await prisma.stockMovement.count({ where: { tenantId: tenantAId } });
    expect(movements).toBe(2);
  });

  it('exports products and sales as CSV', async () => {
    const productCsv = await exportProducts(tenantAId);
    const productRows = parseCSV(productCsv);
    expect(productRows[0]).toEqual([
      'name',
      'sku',
      'price',
      'cost',
      'attributes',
      'imageUrl',
      'batch',
      'expirationDate',
      'active',
      'stock',
    ]);
    expect(productRows.length).toBe(3);

    const sale = await prisma.sale.create({
      data: {
        tenantId: tenantAId,
        branchId,
        userId: (
          await prisma.user.create({
            data: {
              tenantId: tenantAId,
              name: 'Seller',
              email: `seller-${suffix}@test.com`,
              password: 'secret-hash',
              role: 'SELLER',
            },
          })
        ).id,
        total: 120,
        items: {
          create: [
            {
              variantId: (
                await prisma.variant.findFirst({
                  where: { tenantId: tenantAId, sku: `REM-${suffix}` },
                })
              )!.id,
              quantity: 1,
              price: 120,
              tenantId: tenantAId,
            },
          ],
        },
      },
    });

    const salesCsv = await exportSales(tenantAId);
    const salesRows = parseCSV(salesCsv);
    expect(salesRows[0][0]).toBe('saleId');
    expect(salesRows).toHaveLength(2);
    expect(salesRows[1][0]).toBe(sale.id);
    expect(salesRows[1][5]).toBe(`REM-${suffix}`);
  });
});
