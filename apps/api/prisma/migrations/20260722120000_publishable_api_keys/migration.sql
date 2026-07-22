-- CreateTable
CREATE TABLE "publishable_api_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default',
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "created_by_id" UUID NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publishable_api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "publishable_api_keys_key_hash_key" ON "publishable_api_keys"("key_hash");
CREATE INDEX "publishable_api_keys_organization_id_revoked_at_idx" ON "publishable_api_keys"("organization_id", "revoked_at");

ALTER TABLE "publishable_api_keys"
  ADD CONSTRAINT "publishable_api_keys_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "publishable_api_keys"
  ADD CONSTRAINT "publishable_api_keys_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
