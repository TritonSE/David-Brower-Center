-- AlterTable
ALTER TABLE "public"."organizations"
ADD COLUMN IF NOT EXISTS "mission" TEXT;
