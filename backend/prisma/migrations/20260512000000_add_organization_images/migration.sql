-- Add images array to organizations table.
ALTER TABLE "public"."organizations"
  ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Create the Supabase Storage bucket for organization images if the
-- storage schema exists (skipped in plain Postgres without Supabase Storage).
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO "storage"."buckets" ("id", "name", "public")
    VALUES ('organization-images', 'organization-images', TRUE)
    ON CONFLICT ("id") DO UPDATE
      SET "public" = TRUE;
  ELSE
    RAISE NOTICE 'Skipping storage bucket creation: storage.buckets does not exist.';
  END IF;
END
$$;
