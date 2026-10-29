-- CreateEnum
CREATE TYPE "PaymentGatewayType" AS ENUM ('LIBELULA', 'CUCU');

-- CreateEnum
CREATE TYPE "BillingProviderType" AS ENUM ('FACTELEC', 'LIBELULA_NATIVE');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "billingInvoiceId" TEXT,
ADD COLUMN     "billingInvoiceUrl" TEXT,
ADD COLUMN     "gatewayStatus" TEXT,
ADD COLUMN     "gatewayTransactionId" TEXT;

-- CreateTable
CREATE TABLE "TenantPaymentConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "gateway" "PaymentGatewayType" NOT NULL,
    "appkeyEncrypted" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantPaymentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantBillingConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" "BillingProviderType" NOT NULL,
    "credentialsEncrypted" JSONB NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantBillingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantPaymentConfig_tenantId_isActive_idx" ON "TenantPaymentConfig"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TenantPaymentConfig_tenantId_gateway_key" ON "TenantPaymentConfig"("tenantId", "gateway");

-- CreateIndex
CREATE INDEX "TenantBillingConfig_tenantId_isEnabled_idx" ON "TenantBillingConfig"("tenantId", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "TenantBillingConfig_tenantId_provider_key" ON "TenantBillingConfig"("tenantId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Order_gatewayTransactionId_key" ON "Order"("gatewayTransactionId");

-- AddForeignKey
ALTER TABLE "TenantPaymentConfig" ADD CONSTRAINT "TenantPaymentConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantBillingConfig" ADD CONSTRAINT "TenantBillingConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
