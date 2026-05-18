-- CreateEnum
CREATE TYPE "TagVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "tags" ADD COLUMN "color" TEXT NOT NULL DEFAULT '#5A8FBB';
ALTER TABLE "tags" ADD COLUMN "visibility" "TagVisibility" NOT NULL DEFAULT 'PUBLIC';

-- Remove defaults so new rows must supply values explicitly via the application layer.
ALTER TABLE "tags" ALTER COLUMN "color" DROP DEFAULT;
ALTER TABLE "tags" ALTER COLUMN "visibility" DROP DEFAULT;
