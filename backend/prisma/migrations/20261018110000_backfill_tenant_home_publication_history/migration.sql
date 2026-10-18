-- Preserve the currently published MVP content as the first history entry.
UPDATE "TenantHomePage"
SET "revision" = 1
WHERE "publishedContent" IS NOT NULL AND "revision" = 0;

INSERT INTO "TenantHomePublication" ("id", "tenantId", "revision", "content", "publishedAt", "createdAt")
SELECT gen_random_uuid()::text, "tenantId", "revision", "publishedContent", "publishedAt", COALESCE("publishedAt", CURRENT_TIMESTAMP)
FROM "TenantHomePage"
WHERE "publishedContent" IS NOT NULL
ON CONFLICT ("tenantId", "revision") DO NOTHING;
