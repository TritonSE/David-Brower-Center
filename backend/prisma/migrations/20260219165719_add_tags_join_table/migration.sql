/*
  Warnings:

  - You are about to drop the column `tags` on the `organizations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "tags";

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_tags" (
    "organizationId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "organization_tags_pkey" PRIMARY KEY ("organizationId","tagId")
);

-- AddForeignKey
ALTER TABLE "organization_tags" ADD CONSTRAINT "organization_tags_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_tags" ADD CONSTRAINT "organization_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
