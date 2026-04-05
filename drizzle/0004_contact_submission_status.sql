ALTER TABLE "contact_submission" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'new' NOT NULL;
