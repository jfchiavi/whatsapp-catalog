import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  adjustStock,
  transferStock,
  receiveTransfer,
  cancelTransfer,
  getStockByBranch,
  getPendingTransfers,
} from '../src/modules/stock/stock.service';
import { AppError } from '../src/lib/errors';

const TEST_TENANT_ID = '0b95f160-f948-5ac3-921a-56029e130fa9';
const OTHER_TENANT_ID = 'b63747fe-2573-5214-b490-32828299d672';
const BRANCH_CENTRAL = '1075ea0b-a199-5f89-ad10-bcb83627b8a6';
const BRANCH_ONLINE = 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a';
const OTHER_TENANT_BRANCH = '30dde5a8-9bb3-5a8d-9bcf-a624f3d771cd';
const VARIANT_REM_S = 'a9fbfe58-6361-557b-90c0-7dadf311090d';
const VARIANT_REM_M = '40bff466-6107-58ea-af9a-ebb91ec2034a';
const OTHER_TENANT_VARIANT = '19eb60f7-402a-5b13-9002-0cd724384204';

describe('Stock service', () => {
  afterAll(async () => {
    await prisma.stockMovement.deleteMany({
      where: { tenantId: TEST_TENANT_ID, type: 'TRANSFER', status: 'PENDING' },
    });
    await prisma.$disconnect();
  });

  describe('adjustStock', () => {
    it('positive adjustment increases stock and creates movement', async () => {
      const before = await prisma.stock.findUnique({
        where: {
          tenantId_variantId_branchId: {
            tenantId: TEST_TENANT_ID,
            variantId: VARIANT_REM_S,
            branchId: BRANCH_CENTRAL,
          },
        },
      });
      const beforeQty = before?.quantity ?? 0;

      const result = await adjustStock(
        VARIANT_REM_S,
        BRANCH_CENTRAL,
        10,
        TEST_TENANT_ID
      );

      expect(result.quantity).toBe(beforeQty + 10);

      const movement = await prisma.stockMovement.findFirst({
        where: {
          variantId: VARIANT_REM_S,
          fromBranchId: BRANCH_CENTRAL,
          type: 'ADJUST',
          tenantId: TEST_TENANT_ID,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(movement).toBeDefined();
      expect(movement!.quantity).toBe(10);

      await prisma.stock.update({
        where: {
          tenantId_variantId_branchId: {
            tenantId: TEST_TENANT_ID,
            variantId: VARIANT_REM_S,
            branchId: BRANCH_CENTRAL,
          },
        },
        data: { quantity: beforeQty },
      });
    });

    it('negative adjustment with insufficient stock rejects', async () => {
      const before = await prisma.stock.findUnique({
        where: {
          tenantId_variantId_branchId: {
            tenantId: TEST_TENANT_ID,
            variantId: VARIANT_REM_S,
            branchId: BRANCH_CENTRAL,
          },
        },
      });
      const beforeQty = before?.quantity ?? 0;

      await expect(
        adjustStock(VARIANT_REM_S, BRANCH_CENTRAL, -(beforeQty + 1), TEST_TENANT_ID)
      ).rejects.toThrow(AppError);

      const after = await prisma.stock.findUnique({
        where: {
          tenantId_variantId_branchId: {
            tenantId: TEST_TENANT_ID,
            variantId: VARIANT_REM_S,
            branchId: BRANCH_CENTRAL,
          },
        },
      });
      expect(after?.quantity).toBe(beforeQty);
    });

    it('rejects variant from another tenant', async () => {
      await expect(
        adjustStock(OTHER_TENANT_VARIANT, BRANCH_CENTRAL, 5, TEST_TENANT_ID)
      ).rejects.toThrow(AppError);
    });

    it('rejects branch from another tenant', async () => {
      await expect(
        adjustStock(VARIANT_REM_S, OTHER_TENANT_BRANCH, 5, TEST_TENANT_ID)
      ).rejects.toThrow(AppError);
    });
  });

  describe('transferStock', () => {
    let transferId: string;
    const transferQty = 5;

    it('creates PENDING transfer and decreases source', async () => {
      const beforeFrom = await prisma.stock.findUnique({
        where: {
          tenantId_variantId_branchId: {
            tenantId: TEST_TENANT_ID,
            variantId: VARIANT_REM_S,
            branchId: BRANCH_ONLINE,
          },
        },
      });
      const beforeFromQty = beforeFrom?.quantity ?? 0;

      const movement = await transferStock(
        VARIANT_REM_S,
        BRANCH_ONLINE,
        BRANCH_CENTRAL,
        transferQty,
        TEST_TENANT_ID
      );

      expect(movement).toBeDefined();
      expect(movement.status).toBe('PENDING');
      expect(movement.quantity).toBe(transferQty);
      transferId = movement.id;

      const afterFrom = await prisma.stock.findUnique({
        where: {
          tenantId_variantId_branchId: {
            tenantId: TEST_TENANT_ID,
            variantId: VARIANT_REM_S,
            branchId: BRANCH_ONLINE,
          },
        },
      });
      expect(afterFrom?.quantity).toBe(beforeFromQty - transferQty);
    });

    it('receive transfer increases destination', async () => {
      const beforeTo = await prisma.stock.findUnique({
        where: {
          tenantId_variantId_branchId: {
            tenantId: TEST_TENANT_ID,
            variantId: VARIANT_REM_S,
            branchId: BRANCH_CENTRAL,
          },
        },
      });
      const beforeToQty = beforeTo?.quantity ?? 0;

      const result = await receiveTransfer(transferId, transferQty, TEST_TENANT_ID);
      expect(result.status).toBe('COMPLETED');
      expect(result.receivedQuantity).toBe(transferQty);

      const afterTo = await prisma.stock.findUnique({
        where: {
          tenantId_variantId_branchId: {
            tenantId: TEST_TENANT_ID,
            variantId: VARIANT_REM_S,
            branchId: BRANCH_CENTRAL,
          },
        },
      });
      expect(afterTo?.quantity).toBe(beforeToQty + transferQty);
    });

    it('rejects transfer to same branch', async () => {
      await expect(
        transferStock(
          VARIANT_REM_S,
          BRANCH_CENTRAL,
          BRANCH_CENTRAL,
          1,
          TEST_TENANT_ID
        )
      ).rejects.toThrow(AppError);
    });

    it('rejects transfer with insufficient stock', async () => {
      await expect(
        transferStock(
          VARIANT_REM_S,
          BRANCH_CENTRAL,
          BRANCH_ONLINE,
          999999,
          TEST_TENANT_ID
        )
      ).rejects.toThrow(AppError);
    });
  });

  describe('cancelTransfer', () => {
    it('cancel restores source stock', async () => {
      const beforeFrom = await prisma.stock.findUnique({
        where: {
          tenantId_variantId_branchId: {
            tenantId: TEST_TENANT_ID,
            variantId: VARIANT_REM_M,
            branchId: BRANCH_ONLINE,
          },
        },
      });
      const beforeFromQty = beforeFrom?.quantity ?? 0;

      const movement = await transferStock(
        VARIANT_REM_M,
        BRANCH_ONLINE,
        BRANCH_CENTRAL,
        3,
        TEST_TENANT_ID
      );
      expect(movement.status).toBe('PENDING');

      const cancelled = await cancelTransfer(movement.id, TEST_TENANT_ID);
      expect(cancelled.status).toBe('CANCELLED');

      const afterFrom = await prisma.stock.findUnique({
        where: {
          tenantId_variantId_branchId: {
            tenantId: TEST_TENANT_ID,
            variantId: VARIANT_REM_M,
            branchId: BRANCH_ONLINE,
          },
        },
      });
      expect(afterFrom?.quantity).toBe(beforeFromQty);
    });
  });

  describe('getPendingTransfers', () => {
    it('lists pending transfers for tenant', async () => {
      const transfers = await getPendingTransfers(TEST_TENANT_ID);
      expect(Array.isArray(transfers)).toBe(true);
    });

    it('filters by branch', async () => {
      const transfers = await getPendingTransfers(TEST_TENANT_ID, BRANCH_CENTRAL);
      expect(Array.isArray(transfers)).toBe(true);
      transfers.forEach((t) => {
        expect(
          t.fromBranchId === BRANCH_CENTRAL || t.toBranchId === BRANCH_CENTRAL
        ).toBe(true);
      });
    });
  });
});
