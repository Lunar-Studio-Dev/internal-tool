-- Business onboarding: taxonomy tables, business profile/source fields, drop pipeline lead_source

-- CreateTable
CREATE TABLE "source_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allowsSubcategories" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_sub_category" (
    "id" TEXT NOT NULL,
    "sourceCategoryId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_sub_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industry" (
    "id" TEXT NOT NULL,
    "sectorId" TEXT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_location" (
    "businessId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "business_location_pkey" PRIMARY KEY ("businessId","locationId")
);

-- CreateTable
CREATE TABLE "business_tag" (
    "businessId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "business_tag_pkey" PRIMARY KEY ("businessId","tagId")
);

-- AlterTable business
ALTER TABLE "business" ADD COLUMN "sourceCategoryId" TEXT;
ALTER TABLE "business" ADD COLUMN "sourceSubCategoryId" TEXT;
ALTER TABLE "business" ADD COLUMN "sourceReferenceNote" TEXT;
ALTER TABLE "business" ADD COLUMN "sourceReferredByBusinessId" TEXT;
ALTER TABLE "business" ADD COLUMN "sourceReferenceLabel" TEXT;
ALTER TABLE "business" ADD COLUMN "sectorId" TEXT;
ALTER TABLE "business" ADD COLUMN "industryId" TEXT;
ALTER TABLE "business" ADD COLUMN "marketId" TEXT;

-- Drop pipeline lead_source
ALTER TABLE "pipeline" DROP COLUMN IF EXISTS "leadSource";
DROP TYPE IF EXISTS "LeadSource";

-- CreateIndex
CREATE UNIQUE INDEX "source_category_name_key" ON "source_category"("name");
CREATE INDEX "source_sub_category_sourceCategoryId_idx" ON "source_sub_category"("sourceCategoryId");
CREATE INDEX "source_sub_category_parentId_idx" ON "source_sub_category"("parentId");
CREATE UNIQUE INDEX "source_sub_category_sourceCategoryId_parentId_name_key" ON "source_sub_category"("sourceCategoryId", "parentId", "name");
CREATE UNIQUE INDEX "sector_name_key" ON "sector"("name");
CREATE INDEX "industry_sectorId_idx" ON "industry"("sectorId");
CREATE UNIQUE INDEX "industry_sectorId_name_key" ON "industry"("sectorId", "name");
CREATE UNIQUE INDEX "market_name_key" ON "market"("name");
CREATE UNIQUE INDEX "location_name_key" ON "location"("name");
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");
CREATE INDEX "business_sourceCategoryId_idx" ON "business"("sourceCategoryId");
CREATE INDEX "business_sourceSubCategoryId_idx" ON "business"("sourceSubCategoryId");
CREATE INDEX "business_sectorId_idx" ON "business"("sectorId");
CREATE INDEX "business_industryId_idx" ON "business"("industryId");
CREATE INDEX "business_marketId_idx" ON "business"("marketId");
CREATE INDEX "business_sourceReferredByBusinessId_idx" ON "business"("sourceReferredByBusinessId");

-- AddForeignKey
ALTER TABLE "source_sub_category" ADD CONSTRAINT "source_sub_category_sourceCategoryId_fkey" FOREIGN KEY ("sourceCategoryId") REFERENCES "source_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "source_sub_category" ADD CONSTRAINT "source_sub_category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "source_sub_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "industry" ADD CONSTRAINT "industry_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "business_location" ADD CONSTRAINT "business_location_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "business_location" ADD CONSTRAINT "business_location_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "business_tag" ADD CONSTRAINT "business_tag_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "business_tag" ADD CONSTRAINT "business_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "business" ADD CONSTRAINT "business_sourceCategoryId_fkey" FOREIGN KEY ("sourceCategoryId") REFERENCES "source_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "business" ADD CONSTRAINT "business_sourceSubCategoryId_fkey" FOREIGN KEY ("sourceSubCategoryId") REFERENCES "source_sub_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "business" ADD CONSTRAINT "business_sourceReferredByBusinessId_fkey" FOREIGN KEY ("sourceReferredByBusinessId") REFERENCES "business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "business" ADD CONSTRAINT "business_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "business" ADD CONSTRAINT "business_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "industry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "business" ADD CONSTRAINT "business_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed source categories and markets
INSERT INTO "source_category" ("id", "name", "allowsSubcategories", "active", "createdAt", "updatedAt")
VALUES
  ('seed_src_club', 'Club', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed_src_client', 'Existing client', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed_src_external', 'External', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "market" ("id", "name", "active", "createdAt", "updatedAt")
VALUES
  ('seed_mkt_b2b', 'B2B', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed_mkt_b2c', 'B2C', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed_mkt_both', 'BOTH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
