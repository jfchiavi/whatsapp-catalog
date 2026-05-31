-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_variantId_fkey";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "baseAttributes" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Variant" ALTER COLUMN "updatedAt" DROP DEFAULT;
