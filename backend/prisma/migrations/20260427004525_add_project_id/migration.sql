/*
  Warnings:

  - You are about to drop the column `city` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `max_budget` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `min_budget` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `mission` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `organizations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectId]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `tags` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectId` to the `organizations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "createdAt",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "max_budget",
DROP COLUMN "min_budget",
DROP COLUMN "mission",
DROP COLUMN "state",
DROP COLUMN "updatedAt",
ADD COLUMN     "projectId" TEXT NOT NULL,
ADD COLUMN     "sizeCategory" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_projectId_key" ON "organizations"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");
