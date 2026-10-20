-- CreateEnum
CREATE TYPE "StorefrontMetricEvent" AS ENUM ('HOME_VIEW', 'CATALOG_CLICK', 'CATEGORY_CLICK', 'FEATURED_PRODUCT_CLICK', 'WHATSAPP_CLICK');

-- CreateTable
CREATE TABLE "StorefrontMetricDaily" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "event" "StorefrontMetricEvent" NOT NULL,
    "target" TEXT NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorefrontMetricDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StorefrontMetricDaily_tenantId_day_idx" ON "StorefrontMetricDaily"("tenantId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "StorefrontMetricDaily_tenantId_day_event_target_key" ON "StorefrontMetricDaily"("tenantId", "day", "event", "target");

-- AddForeignKey
ALTER TABLE "StorefrontMetricDaily" ADD CONSTRAINT "StorefrontMetricDaily_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;