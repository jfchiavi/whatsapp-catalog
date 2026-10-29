-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_userId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerNit" TEXT;

-- AlterTable
ALTER TABLE "Sale" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "codigoProductoSin" TEXT;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

