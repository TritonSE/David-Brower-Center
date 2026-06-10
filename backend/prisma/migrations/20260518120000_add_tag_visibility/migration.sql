-- CreateEnum
CREATE TYPE "TagVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "tags" ADD COLUMN "visibility" "TagVisibility" NOT NULL DEFAULT 'PUBLIC';
