-- Ensure the application users table exists in the public schema.
CREATE TABLE IF NOT EXISTS "public"."users" (
    "supabase_user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("supabase_user_id")
);

-- Ensure the unique email constraint exists for existing databases.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_email_key'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE "public"."users"
      ADD CONSTRAINT "users_email_key" UNIQUE ("email");
  END IF;
END
$$;

-- Remove the cross-schema FK to auth.users so Prisma can manage only public schema.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_supabase_user_id_fkey'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE "public"."users" DROP CONSTRAINT "users_supabase_user_id_fkey";
  END IF;
END
$$;
