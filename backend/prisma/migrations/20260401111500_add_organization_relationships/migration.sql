-- CreateEnum
CREATE TYPE "RelationshipTier" AS ENUM ('PRIMARY', 'SECONDARY', 'TERTIARY');

-- CreateTable
CREATE TABLE "organization_relationships" (
    "id" UUID NOT NULL,
    "npo1Id" UUID NOT NULL,
    "npo2Id" UUID NOT NULL,
    "relationshipTier" "RelationshipTier" NOT NULL,
    "relationshipType" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organization_relationships_npo1Id_idx" ON "organization_relationships"("npo1Id");

-- CreateIndex
CREATE INDEX "organization_relationships_npo2Id_idx" ON "organization_relationships"("npo2Id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_relationships_npo1Id_npo2Id_relationshipTier_key" ON "organization_relationships"("npo1Id", "npo2Id", "relationshipTier");

-- AddForeignKey
ALTER TABLE "organization_relationships" ADD CONSTRAINT "organization_relationships_npo1Id_fkey" FOREIGN KEY ("npo1Id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_relationships" ADD CONSTRAINT "organization_relationships_npo2Id_fkey" FOREIGN KEY ("npo2Id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

