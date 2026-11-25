-- Lounge passes: every booking gets an unguessable pass token, shown to the customer as a QR
-- code. Staff scan it at the counter to verify the booking and record the visit (check-in).

-- 64 hex characters from two random UUIDs (244 random bits); filled in for existing rows too.
ALTER TABLE "bookings"
  ADD COLUMN "pass_token" VARCHAR(64) NOT NULL
  DEFAULT (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''));
CREATE UNIQUE INDEX "bookings_pass_token_key" ON "bookings"("pass_token");

ALTER TABLE "bookings" ADD COLUMN "checked_in_at" TIMESTAMPTZ(6);
ALTER TABLE "bookings" ADD COLUMN "checked_in_by" INTEGER;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_checked_in_by_fkey"
  FOREIGN KEY ("checked_in_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
