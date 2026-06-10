CREATE TABLE "public"."account_creation_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_creation_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "account_creation_requests_email_key" ON "public"."account_creation_requests"("email");
