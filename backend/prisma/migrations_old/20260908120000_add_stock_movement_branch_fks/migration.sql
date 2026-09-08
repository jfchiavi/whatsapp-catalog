-- Add missing Branch FKs to StockMovement (init migration predated these relations)
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_fromBranchId_fkey" FOREIGN KEY ("fromBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_toBranchId_fkey" FOREIGN KEY ("toBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
