import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Start a transaction
  await prisma.$transaction(async (tx) => {
    // Step 1: Ensure uuid-ossp extension exists
    await tx.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

    // Step 2: Insert a default tenant and get its id
    const [tenantResult] = await tx.$executeRaw<
      Array<{ id: string }>
    >`INSERT INTO "Tenant" (id) VALUES (uuid_generate_v4()) RETURNING id;`
    const tenantId = tenantResult.id

    console.log(`Created default tenant with id: ${tenantId}`)

    // Step 3: Update existing records to set tenantId
    const tables = ['User', 'Branch', 'Product', 'RefreshToken', 'WhatsappOrder']
    for (const table of tables) {
      await tx.$executeRaw(
        Prisma.sql`UPDATE "${table}" SET "tenantId" = ${tenantId} WHERE "tenantId" IS NULL;`
      )
      console.log(`Updated ${table} with tenantId: ${tenantId}`)
    }

    // Step 4: Create Variants for each Product
    const products = await tx.$executeRaw<
      Array<{ id: string; sku: string; price: number; cost: number }>
    >`SELECT "id", "sku", "price", "cost" FROM "Product";`

    for (const product of products) {
      await tx.$executeRaw(
        Prisma.sql`INSERT INTO "Variant" (
          "id", "productId", "tenantId", "sku", "price", "cost", "attributes"
        ) VALUES (
          uuid_generate_v4(),
          ${product.id},
          ${tenantId},
          ${product.sku},
          ${product.price},
          ${product.cost},
          '{}'::jsonb
        );`
      )
    }
    console.log(`Created ${products.length} Variants`)

    // Step 5: Update Stock to point to Variant
    await tx.$executeRaw(`
      UPDATE "Stock" 
      SET 
        "variantId" = v."id",
        "tenantId" = ${tenantId}
      FROM "Variant" v
      WHERE "Stock"."productId" = v."productId"
        AND v."tenantId" = ${tenantId};
    `)
    console.log('Updated Stock to point to Variant')

    // Step 6: Update StockMovement to point to Variant
    await tx.$executeRaw(`
      UPDATE "StockMovement" 
      SET 
        "variantId" = v."id",
        "tenantId" = ${tenantId},
        "userId" = "userId" -- keep existing userId if any
      FROM "Variant" v
      WHERE "StockMovement"."productId" = v."productId"
        AND v."tenantId" = ${tenantId};
    `)
    console.log('Updated StockMovement to point to Variant')

    // Step 7: Update SaleItem to point to Variant
    await tx.$executeRaw(`
      UPDATE "SaleItem" 
      SET 
        "variantId" = v."id",
        "tenantId" = ${tenantId}
      FROM "Variant" v
      WHERE "SaleItem"."productId" = v."productId"
        AND v."tenantId" = ${tenantId};
    `)
    console.log('Updated SaleItem to point to Variant')
  })

  console.log('Migration completed successfully')
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })