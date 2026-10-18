-- AlterTable
ALTER TABLE "TenantHomePage" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TenantHomePublication" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantHomePublication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantHomePublication_tenantId_publishedAt_idx" ON "TenantHomePublication"("tenantId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TenantHomePublication_tenantId_revision_key" ON "TenantHomePublication"("tenantId", "revision");

-- AddForeignKey
ALTER TABLE "TenantHomePublication" ADD CONSTRAINT "TenantHomePublication_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;