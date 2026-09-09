-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "slug" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Tenant" ADD COLUMN "domain" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "primaryColor" TEXT DEFAULT '#000000';
ALTER TABLE "Tenant" ADD COLUMN "description" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "whatsappNumber" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");
