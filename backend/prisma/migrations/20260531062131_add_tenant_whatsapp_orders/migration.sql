/*
  Warnings:

  - Added the required column `tenantId` to the `WhatsappOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WhatsappOrder" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "WhatsappOrder" ADD CONSTRAINT "WhatsappOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
