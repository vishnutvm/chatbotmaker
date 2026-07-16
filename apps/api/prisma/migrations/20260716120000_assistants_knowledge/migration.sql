-- CreateEnum
CREATE TYPE "AssistantStatus" AS ENUM ('draft', 'live', 'paused');

-- CreateEnum
CREATE TYPE "AssistantPurpose" AS ENUM ('customer_support', 'sales', 'product_expert', 'documentation', 'lead_generation', 'custom');

-- CreateEnum
CREATE TYPE "AssistantTone" AS ENUM ('friendly', 'professional', 'helpful', 'concise', 'custom');

-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('text', 'url');

-- CreateEnum
CREATE TYPE "KnowledgeSourceStatus" AS ENUM ('pending', 'ready', 'failed');

-- CreateTable
CREATE TABLE "assistants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "purpose" "AssistantPurpose" NOT NULL DEFAULT 'custom',
    "status" "AssistantStatus" NOT NULL DEFAULT 'draft',
    "welcome_message" TEXT NOT NULL DEFAULT '',
    "tone" "AssistantTone" NOT NULL DEFAULT 'friendly',
    "instructions" TEXT NOT NULL DEFAULT '',
    "appearance" JSONB NOT NULL DEFAULT '{}',
    "deployed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_sources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "assistant_id" UUID NOT NULL,
    "type" "KnowledgeSourceType" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "KnowledgeSourceStatus" NOT NULL DEFAULT 'pending',
    "content" TEXT,
    "url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assistants_organization_id_updated_at_idx" ON "assistants"("organization_id", "updated_at");

-- CreateIndex
CREATE INDEX "knowledge_sources_assistant_id_idx" ON "knowledge_sources"("assistant_id");

-- CreateIndex
CREATE INDEX "knowledge_sources_organization_id_assistant_id_idx" ON "knowledge_sources"("organization_id", "assistant_id");

-- AddForeignKey
ALTER TABLE "assistants"
  ADD CONSTRAINT "assistants_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_sources"
  ADD CONSTRAINT "knowledge_sources_assistant_id_fkey"
  FOREIGN KEY ("assistant_id") REFERENCES "assistants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
