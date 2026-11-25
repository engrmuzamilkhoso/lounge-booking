-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "lname" VARCHAR(50),
    "cnic" VARCHAR(50),
    "contact" VARCHAR(50),
    "email" VARCHAR(255) NOT NULL,
    "email_verified_at" TIMESTAMPTZ(6),
    "password" VARCHAR(255) NOT NULL,
    "otp_hash" VARCHAR(255),
    "otp_expires_at" TIMESTAMPTZ(6),
    "otp_attempts" INTEGER NOT NULL DEFAULT 0,
    "remember_token" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_user" (
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "role_user_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "permission_role" (
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "permission_role_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "user_agent" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lounge_services" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon_for_app" VARCHAR(20),
    "app_desc" VARCHAR(100),
    "app_route" VARCHAR(45),
    "app_icon" VARCHAR(45),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "lounge_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "service_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "name" VARCHAR(255),
    "description" TEXT,
    "price" DECIMAL(15,2),
    "adult_limit" INTEGER NOT NULL,
    "child_price" INTEGER NOT NULL,
    "child_limit" INTEGER NOT NULL,
    "infant_price" INTEGER NOT NULL,
    "infant_limit" INTEGER NOT NULL,
    "guest_price" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "detail" VARCHAR(50) NOT NULL,
    "bin" VARCHAR(100) NOT NULL,
    "sort_order" SMALLINT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "price_1" DECIMAL(15,2) NOT NULL,
    "price_1_text" VARCHAR(100) NOT NULL,
    "price_2" DECIMAL(15,2) NOT NULL,
    "price_2_text" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "membership_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" SERIAL NOT NULL,
    "membership_type_id" INTEGER,
    "product_id" INTEGER,
    "serial_no" VARCHAR(200) NOT NULL DEFAULT '0',
    "visit_limit" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "dob" DATE NOT NULL,
    "contact_no" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "zipcode" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "membership_declaration" VARCHAR(2) DEFAULT '0',
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" SERIAL NOT NULL,
    "service_id" INTEGER NOT NULL,
    "customer_id" INTEGER,
    "category_id" INTEGER,
    "product_id" INTEGER,
    "source_request_id" INTEGER,
    "membership_id" INTEGER,
    "bank_id" INTEGER,
    "code" VARCHAR(255) NOT NULL,
    "flight_number" VARCHAR(255) NOT NULL,
    "flight_detail" VARCHAR(255),
    "departure_date" DATE NOT NULL,
    "departure_time" TIME(0),
    "adult_qty" INTEGER,
    "child_qty" INTEGER,
    "infant_qty" INTEGER,
    "guest_qty" INTEGER,
    "total_amount" INTEGER,
    "idempotency_key" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_details" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "nationality" VARCHAR(100),
    "attendee_type" SMALLINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "dob" DATE NOT NULL,
    "passport_cnic" VARCHAR(255),
    "passport_cnic_expiry" VARCHAR(255),
    "contact_no" VARCHAR(100),
    "email" VARCHAR(255),
    "address" TEXT,
    "guardian_contact" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "booking_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_booking" (
    "id" SERIAL NOT NULL,
    "service" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "departure_date" DATE NOT NULL,
    "departure_time" TIME(0) NOT NULL,
    "adult_qty" INTEGER NOT NULL,
    "child_qty" INTEGER NOT NULL,
    "infant_qty" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "whatsapp_booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_requests" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "source_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nationalities" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "nationalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statuses" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_categories" (
    "id" SERIAL NOT NULL,
    "category" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "faq_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_questions" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER,
    "question" TEXT,
    "answer" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "faq_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "subject_id" INTEGER,
    "subject_type" VARCHAR(255),
    "user_id" INTEGER,
    "properties" JSONB,
    "host" VARCHAR(46),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "role_user_role_id_idx" ON "role_user"("role_id");

-- CreateIndex
CREATE INDEX "permission_role_permission_id_idx" ON "permission_role"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "products_service_id_category_id_idx" ON "products"("service_id", "category_id");

-- CreateIndex
CREATE INDEX "memberships_serial_no_idx" ON "memberships"("serial_no");

-- CreateIndex
CREATE INDEX "memberships_status_idx" ON "memberships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_code_key" ON "bookings"("code");

-- CreateIndex
CREATE INDEX "bookings_customer_id_idx" ON "bookings"("customer_id");

-- CreateIndex
CREATE INDEX "bookings_membership_id_idx" ON "bookings"("membership_id");

-- CreateIndex
CREATE INDEX "bookings_departure_date_idx" ON "bookings"("departure_date");

-- CreateIndex
CREATE INDEX "bookings_created_at_idx" ON "bookings"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_customer_id_idempotency_key_key" ON "bookings"("customer_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "booking_details_booking_id_idx" ON "booking_details"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "nationalities_name_key" ON "nationalities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "statuses_name_key" ON "statuses"("name");

-- CreateIndex
CREATE INDEX "faq_questions_category_id_idx" ON "faq_questions"("category_id");

-- CreateIndex
CREATE INDEX "audit_logs_subject_type_idx" ON "audit_logs"("subject_type");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "role_user" ADD CONSTRAINT "role_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_user" ADD CONSTRAINT "role_user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_role" ADD CONSTRAINT "permission_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_role" ADD CONSTRAINT "permission_role_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "lounge_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_membership_type_id_fkey" FOREIGN KEY ("membership_type_id") REFERENCES "membership_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "lounge_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_source_request_id_fkey" FOREIGN KEY ("source_request_id") REFERENCES "source_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_details" ADD CONSTRAINT "booking_details_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_questions" ADD CONSTRAINT "faq_questions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "faq_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Hand-written additions: rules Prisma schema syntax cannot express.

-- 1. Case-insensitive unique email (MariaDB utf8mb4_unicode_ci behaviour).
CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email));

-- 2. Enum-like integer columns.
ALTER TABLE booking_details
  ADD CONSTRAINT booking_details_attendee_type_check CHECK (attendee_type IN (1, 2, 3));

ALTER TABLE memberships
  ADD CONSTRAINT memberships_status_check CHECK (status IN (1, 2));

-- An approved membership must have its product and visit limit assigned.
ALTER TABLE memberships
  ADD CONSTRAINT memberships_approved_fields_check
  CHECK (status <> 2 OR (product_id IS NOT NULL AND visit_limit IS NOT NULL));

ALTER TABLE bookings
  ADD CONSTRAINT bookings_quantities_check
  CHECK (coalesce(adult_qty, 0) >= 0 AND coalesce(child_qty, 0) >= 0
     AND coalesce(infant_qty, 0) >= 0 AND coalesce(guest_qty, 0) >= 0);

-- 3. Row Level Security: deny everything to Supabase's anon/authenticated roles.
--    The NestJS API connects as the database owner and is not affected.
DO $$
DECLARE
  table_record record;
BEGIN
  FOR table_record IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
  END LOOP;
END $$;
