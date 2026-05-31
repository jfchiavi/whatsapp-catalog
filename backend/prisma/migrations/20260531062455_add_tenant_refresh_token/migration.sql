/*
  Warnings:

  - Added the required column `tenantId` to the `RefreshToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
