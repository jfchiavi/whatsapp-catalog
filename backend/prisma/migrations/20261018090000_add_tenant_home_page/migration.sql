-- CreateTable
CREATE TABLE "TenantHomePage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "draftContent" JSONB NOT NULL,
    "publishedContent" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantHomePage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantHomePage_tenantId_key" ON "TenantHomePage"("tenantId");

-- AddForeignKey
ALTER TABLE "TenantHomePage" ADD CONSTRAINT "TenantHomePage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;