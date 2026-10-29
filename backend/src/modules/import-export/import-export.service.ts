import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { adjustStock } from '@/modules/stock/stock.service';
import { checkLowStock } from '@/modules/notifications/notifications.service';

export const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };

  const pushRow = () => {
    pushField();
    if (row.length > 1 || row[0]?.trim() !== '') {
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      pushField();
    } else if (char === '\n') {
      pushRow();
    } else if (char === '\r') {
      // ignorar CR (CRLF)
    } else {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    pushRow();
  }

  return rows;
};

export const toCSV = (
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string => {
  const escape = (value: string | number | boolean | null | undefined) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  return [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n');
};

const parseAttributes = (raw: string | undefined): Record<string, string> => {
  if (!raw?.trim()) return {};

  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [key, String(value)])
        );
      }
    } catch {
      throw new AppError('Invalid attributes JSON', 400, 'INVALID_ATTRIBUTES');
    }
  }

  return Object.fromEntries(
    trimmed
      .split(';')
      .map((pair) => pair.split('='))
      .filter((parts) => parts.length >= 2)
      .map(([key, ...rest]) => [key.trim(), rest.join('=').trim()])
  );
};

const headerIndex = (headers: string[], name: string) => {
  const index = headers.indexOf(name);
  return index === -1 ? null : index;
};

const valueAt = (row: string[], index: number | null) => (index === null ? undefined : row[index]?.trim());

export type ImportSummary = {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
};

export const importProducts = async (tenantId: string, csv: string): Promise<ImportSummary> => {
  const rows = parseCSV(csv);
  if (rows.length < 2) {
    throw new AppError('CSV must include a header row and at least one data row', 400, 'EMPTY_CSV');
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const idx = {
    name: headerIndex(headers, 'name'),
    sku: headerIndex(headers, 'sku'),
    price: headerIndex(headers, 'price'),
    cost: headerIndex(headers, 'cost'),
    attributes: headerIndex(headers, 'attributes'),
    imageUrl: headerIndex(headers, 'imageurl'),
    batch: headerIndex(headers, 'batch'),
    expirationDate: headerIndex(headers, 'expirationdate'),
  };

  if (idx.name === null || idx.sku === null || idx.price === null || idx.cost === null) {
    throw new AppError('CSV must include name, sku, price and cost columns', 400, 'INVALID_HEADER');
  }

  const summary: ImportSummary = { created: 0, updated: 0, errors: [] };

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const rowNumber = i + 1;

    try {
      const name = valueAt(row, idx.name);
      const sku = valueAt(row, idx.sku);
      const price = Number(valueAt(row, idx.price));
      const cost = Number(valueAt(row, idx.cost));

      if (!name || !sku) {
        throw new AppError('name and sku are required', 400, 'INVALID_ROW');
      }
      if (!Number.isFinite(price) || price < 0 || !Number.isFinite(cost) || cost < 0) {
        throw new AppError('price and cost must be non-negative numbers', 400, 'INVALID_ROW');
      }

      const attributes = parseAttributes(valueAt(row, idx.attributes));
      const imageUrl = valueAt(row, idx.imageUrl) || null;
      const batch = valueAt(row, idx.batch) || null;
      const expirationRaw = valueAt(row, idx.expirationDate);
      const expirationDate = expirationRaw ? new Date(expirationRaw) : null;
      if (expirationDate && Number.isNaN(expirationDate.getTime())) {
        throw new AppError('expirationDate must be a valid date', 400, 'INVALID_ROW');
      }

      const existingVariant = await prisma.variant.findFirst({
        where: { tenantId, sku },
        include: { product: true },
      });

      if (existingVariant) {
        await prisma.variant.update({
          where: { id: existingVariant.id },
          data: { price, cost, attributes },
        });
        await prisma.product.update({
          where: { id: existingVariant.productId },
          data: {
            name,
            ...(imageUrl ? { imageUrl } : {}),
            ...(batch ? { batch } : {}),
            ...(expirationDate ? { expirationDate } : {}),
          },
        });
        summary.updated += 1;
        continue;
      }

      const product = await prisma.product.findFirst({
        where: { tenantId, name },
      });

      const productId = product
        ? product.id
        : (
            await prisma.product.create({
              data: {
                tenantId,
                name,
                imageUrl,
                batch,
                expirationDate,
                baseAttributes: attributes,
              },
            })
          ).id;

      await prisma.variant.create({
        data: {
          tenantId,
          productId,
          sku,
          price,
          cost,
          attributes,
        },
      });

      summary.created += 1;
    } catch (error) {
      summary.errors.push({
        row: rowNumber,
        message: error instanceof AppError ? error.message : 'Row could not be imported',
      });
    }
  }

  return summary;
};

export const importStock = async (
  tenantId: string,
  csv: string,
  userId?: string
): Promise<ImportSummary> => {
  const rows = parseCSV(csv);
  if (rows.length < 2) {
    throw new AppError('CSV must include a header row and at least one data row', 400, 'EMPTY_CSV');
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const idx = {
    sku: headerIndex(headers, 'sku'),
    branchId: headerIndex(headers, 'branchid'),
    quantity: headerIndex(headers, 'quantity'),
  };

  if (idx.sku === null || idx.branchId === null || idx.quantity === null) {
    throw new AppError('CSV must include sku, branchId and quantity columns', 400, 'INVALID_HEADER');
  }

  const summary: ImportSummary = { created: 0, updated: 0, errors: [] };

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const rowNumber = i + 1;

    try {
      const sku = valueAt(row, idx.sku);
      const branchId = valueAt(row, idx.branchId);
      const quantity = Number(valueAt(row, idx.quantity));

      if (!sku || !branchId) {
        throw new AppError('sku and branchId are required', 400, 'INVALID_ROW');
      }
      if (!Number.isInteger(quantity)) {
        throw new AppError('quantity must be an integer delta', 400, 'INVALID_ROW');
      }

      const variant = await prisma.variant.findFirst({ where: { tenantId, sku } });
      if (!variant) {
        throw new AppError(`Variant with sku ${sku} not found`, 404, 'NOT_FOUND');
      }

      await adjustStock(variant.id, branchId, quantity, tenantId, userId);
      summary.updated += 1;
    } catch (error) {
      summary.errors.push({
        row: rowNumber,
        message: error instanceof AppError ? error.message : 'Row could not be imported',
      });
    }
  }

  await checkLowStock(tenantId);

  return summary;
};

export const exportProducts = async (tenantId: string) => {
  const products = await prisma.product.findMany({
    where: { tenantId },
    include: {
      variants: {
        include: { stock: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const rows = products.flatMap((product) =>
    product.variants.map((variant) => [
      product.name,
      variant.sku,
      variant.price,
      variant.cost,
      JSON.stringify(variant.attributes),
      product.imageUrl ?? '',
      product.batch ?? '',
      product.expirationDate ? product.expirationDate.toISOString() : '',
      product.active,
      variant.stock.reduce((sum, stock) => sum + stock.quantity, 0),
    ])
  );

  return toCSV(
    ['name', 'sku', 'price', 'cost', 'attributes', 'imageUrl', 'batch', 'expirationDate', 'active', 'stock'],
    rows
  );
};

export const exportSales = async (tenantId: string, from?: Date, to?: Date) => {
  const sales = await prisma.sale.findMany({
    where: {
      tenantId,
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    include: {
      branch: { select: { name: true } },
      user: { select: { name: true, email: true } },
      items: {
        include: {
          variant: { select: { sku: true, product: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = sales.flatMap((sale) =>
    sale.items.map((item) => [
      sale.id,
      sale.createdAt.toISOString(),
      sale.branch.name,
      sale.user?.name ?? 'Sistema',
      item.variant.product.name,
      item.variant.sku,
      item.quantity,
      item.price,
      item.price * item.quantity,
      sale.total,
    ])
  );

  return toCSV(
    [
      'saleId',
      'date',
      'branch',
      'user',
      'product',
      'sku',
      'quantity',
      'unitPrice',
      'lineTotal',
      'saleTotal',
    ],
    rows
  );
};
