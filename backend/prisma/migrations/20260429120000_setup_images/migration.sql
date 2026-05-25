-- Add image metadata to application tables.
ALTER TABLE "public"."organizations"
  ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "public"."users"
  ADD COLUMN "profile_picture" TEXT;

-- Create the public Supabase Storage bucket used for organization and profile images.
-- Local Postgres instances without Supabase Storage can still run the schema migration.
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO "storage"."buckets" ("id", "name", "public")
    VALUES ('images', 'images', TRUE)
    ON CONFLICT ("id") DO UPDATE
      SET "public" = TRUE;
  ELSE
    RAISE NOTICE 'Skipping Supabase storage bucket setup because storage.buckets does not exist.';
  END IF;
END
$$;
