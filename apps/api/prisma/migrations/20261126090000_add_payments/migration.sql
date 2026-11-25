-- Online payments (Safepay) and Google profile pictures.

-- Users: profile picture from Google Sign-In.
ALTER TABLE "users" ADD COLUMN "avatar_url" VARCHAR(1024);

-- Bookings: payment status. Existing (Laravel) bookings were settled offline → not_required.
ALTER TABLE "bookings" ADD COLUMN "payment_status" VARCHAR(20) NOT NULL DEFAULT 'not_required';
CREATE INDEX "bookings_payment_status_idx" ON "bookings"("payment_status");
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_payment_status_check"
  CHECK ("payment_status" IN ('not_required', 'pending', 'paid', 'failed', 'refunded'));

-- Payments: one row per gateway payment attempt.
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "customer_id" INTEGER,
    "gateway" VARCHAR(30) NOT NULL,
    "gateway_reference" VARCHAR(100) NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "gateway_state" VARCHAR(40),
    "payment_method" VARCHAR(60),
    "gateway_response" JSONB,
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_gateway_reference_key" ON "payments"("gateway_reference");
CREATE INDEX "payments_booking_id_idx" ON "payments"("booking_id");
CREATE INDEX "payments_status_idx" ON "payments"("status");

ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Hand-written rules Prisma cannot express.
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_status_check"
  CHECK ("status" IN ('pending', 'paid', 'failed', 'cancelled', 'refunded'));
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_positive_check" CHECK ("amount_minor" > 0);

-- At most one open payment session per booking: the database itself prevents a second
-- concurrent checkout (and so a double charge) even if two requests race.
CREATE UNIQUE INDEX "payments_one_pending_per_booking"
  ON "payments"("booking_id") WHERE "status" = 'pending';

-- Same deny-all row level security as every other table (only the API's owner role connects).
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
