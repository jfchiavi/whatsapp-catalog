-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "gatewayPaymentUrl" TEXT,
ADD COLUMN     "gatewayQrUrl" TEXT;
