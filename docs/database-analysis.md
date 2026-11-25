# Database Analysis

Source of truth: `backup/new_majestic.sql` (MariaDB 10.11.18, dumped 21 Jul 2026).
The older `new_majestic.sql` (Sep 2025) and `database/migrations/*` are **out of date** and
must not be used to design the new schema.

Charset: `utf8mb4_unicode_ci` everywhere except `cards` and `failed_jobs` (`latin1`).
Dump `time_zone = +00:00`.

## 1. Row counts (at dump time)

| Table                              |     Rows | Next AUTO_INCREMENT | Category                            |
| ---------------------------------- | -------: | ------------------: | ----------------------------------- |
| users                              |      737 |                 870 | core                                |
| role_user                          |      737 |                   — | core (pivot)                        |
| roles                              |        4 |                   5 | core                                |
| permissions                        |      123 |                 124 | core                                |
| permission_role                    |      126 |                   — | core (pivot)                        |
| lounge_services                    |        4 |                  23 | catalog                             |
| product_categories                 |        3 |                   4 | catalog                             |
| products                           |       11 |                  19 | catalog                             |
| cards                              |       70 |                  75 | catalog (eligible bank cards)       |
| membership_types                   |        1 |                   2 | catalog                             |
| memberships                        |        6 |                   7 | core                                |
| bookings                           |      179 |                 202 | **core**                            |
| booking_details                    |      329 |                 606 | **core**                            |
| nationalities                      |      242 |                1476 | lookup                              |
| source_requests                    |        2 |                   3 | lookup                              |
| statuses                           |        8 |                   9 | lookup (unused by bookings)         |
| movements                          |        2 |                   3 | lookup (unused)                     |
| booking_types                      |        0 |                   3 | unused                              |
| vouchers                           |        0 |                   — | unused                              |
| majestic_cards                     |        0 |                   — | unused                              |
| product_tags / product_product_tag |    0 / 0 |                   — | unused                              |
| product_product_category           |        1 |                   — | unused (products use `category_id`) |
| faq_categories / faq_questions     |    1 / 7 |               2 / 8 | content                             |
| audit_logs                         |      921 |                 922 | audit                               |
| media                              |        0 |                   — | unused                              |
| personal_access_tokens             |        5 |                   6 | framework (Sanctum)                 |
| password_resets                    |        0 |                   — | framework                           |
| jobs / failed_jobs                 | 462 / 87 |                   — | framework (do not migrate)          |
| migrations                         |       38 |                   — | framework (do not migrate)          |

## 2. Table definitions and relationships

`FK` = enforced foreign key in MariaDB. `ref` = logical reference used by code but **not enforced**.

### users

`id bigint PK`, `name varchar(255) null`, `lname varchar(50)`, `cnic varchar(50)`, `contact varchar(50)`,
`email varchar(255) NOT NULL UNIQUE`, `email_verified_at datetime`, `password varchar(255)` (bcrypt `$2y$`),
`otp varchar(10)`, `otp_expires_at timestamp`, `remember_token`, timestamps, `deleted_at`.

### roles / permissions / role_user / permission_role

- `roles`: 1 Admin, 2 Customer, 3 test (soft-deleted), 4 Agent.
- `permissions`: 123 titles (`<entity>_access|create|edit|show|delete`, plus `approve_membership`,
  `product_lounge`, `product_memberships`, `dashboard`, `booking_orders`, `agent_empty`, `profile_password_edit`).
- `role_user (user_id FK→users CASCADE, role_id FK→roles CASCADE)` — no PK, no unique.
  Distribution: 735 Customer, 1 Admin, 1 Agent.
- `permission_role (role_id FK CASCADE, permission_id FK CASCADE)` — Admin has all 123; Customer and Agent have only `agent_empty`.

### lounge_services ("services")

`id`, `name varchar(100)`, `icon_for_app`, `app_desc`, `app_route`, `app_icon` (emoji), timestamps, soft delete.
Rows: 1 Meet and assist · 2 Lounge Service · 3 Membership · 4 Premier Services. **Ids are hard-coded in controllers.**

### product_categories

1 Domestic · 2 International · 3 International-domestic. Hard-coded in controllers.

### products

`id`, `service_id bigint NOT NULL (ref→lounge_services)`, `category_id bigint NOT NULL (ref→product_categories)`,
`name`, `description longtext`, `price decimal(15,2)`, `adult_limit int`, `child_price int`, `child_limit int`,
`infant_price int`, `infant_limit int`, `guest_price int null`, timestamps, soft delete.
Note mixed money types: `price` decimal, other prices int.

### cards (eligible bank cards for lounge)

`id int PK`, `name varchar(200)`, `detail varchar(50)`, `bin varchar(100)`, `services_code int`, `visit_type int`,
`sort_order tinyint`, `status tinyint(1) default 1`, `created_at NOT NULL`, `updated_at NOT NULL default '0000-00-00'`,
`deleted_at`. **69 rows have zero-date `updated_at`.** Meaning of `services_code` / `visit_type` is not used anywhere in code — needs business confirmation.

### membership_types

`id`, `name`, `price_1 decimal(15,2)`, `price_1_text`, `price_2 decimal(15,2)`, `price_2_text`, timestamps, soft delete.

### memberships

`id`, `membership_type_id FK→membership_types`, `product_id int NOT NULL (ref→products)`,
`serial_no varchar(200) default '0'` (8-digit zero-padded once approved), `visit_limit int`,
`name`, `dob date`, `contact_no`, `email`, `address`, `city`, `state`, `zipcode`, `country`,
`membership_declaration varchar(2)`, `status int default 1` (1 = pending, 2 = approved), timestamps, soft delete.
No link to `users`.

### bookings

| Column                                      | Type                  | Notes                                                                |
| ------------------------------------------- | --------------------- | -------------------------------------------------------------------- |
| id                                          | bigint PK             |                                                                      |
| service_id                                  | int NOT NULL          | ref→lounge_services (no FK)                                          |
| customer_id                                 | bigint null           | **FK→users**                                                         |
| category_id                                 | bigint null           | **FK→product_categories**                                            |
| product_id                                  | bigint null           | **FK→products**                                                      |
| source_request_id                           | bigint null           | **FK→source_requests** (1 Web, 2 App)                                |
| membership_id                               | int null              | ref→memberships (no FK) — 11 rows hold `0` (meaning none), rest NULL |
| bank_id                                     | int null              | ref→cards (no FK) — 166 rows set, all resolve                        |
| code                                        | varchar(255) NOT NULL | "ML0000201"; **not unique — 4 duplicates exist**                     |
| flight_number                               | varchar(255) NOT NULL |                                                                      |
| flight_detail                               | varchar(255) null     | not referenced in code                                               |
| departure_date                              | date NOT NULL         | local (PKT) flight date                                              |
| departure_time                              | time null             | local flight time                                                    |
| adult_qty, child_qty, infant_qty, guest_qty | int null              |                                                                      |
| total_amount                                | int null              | PKR, whole rupees                                                    |
| created_at, updated_at, deleted_at          | timestamp             |                                                                      |

No status column.

### booking_details (passengers / attendees)

`id`, `booking_id int NOT NULL (ref→bookings, no FK; 0 orphans)`, `nationality varchar(100)` (free text, not FK),
`attendee_type int` (1 Adult, 2 Child, 3 Infant), `name`, `dob date NOT NULL`, `passport_cnic`, `passport_cnic_expiry varchar`,
`contact_no`, `email`, `address`, timestamps, soft delete. No `guardian_contact` column.

### Other

- `nationalities (name UNIQUE)`, `statuses (name UNIQUE)`, `source_requests`, `movements`, `booking_types`: id + name + timestamps + soft delete.
- `vouchers (product_id FK→products)`, `majestic_cards (membership_type_id FK)`: empty.
- `faq_questions (category_id FK→faq_categories)`.
- `audit_logs`: `description`, `subject_id`, `subject_type` ("App\Models\Booking#12"), `user_id`, `properties text` (JSON), `host`.
- `media`: Spatie schema with 4 JSON `longtext CHECK(json_valid)` columns; empty.

## 3. Entity relationship summary

```
users ─< role_user >─ roles ─< permission_role >─ permissions
users ─< bookings >─ products >─ lounge_services
                 │           └─ product_categories
                 ├─ product_categories
                 ├─ source_requests
                 ├─ memberships (ref) >─ membership_types
                 ├─ cards (ref, bank_id)
                 └─< booking_details (ref)
memberships >─ products (ref)
faq_questions >─ faq_categories
```

## 4. PostgreSQL design (approved 25 Nov 2026)

Principles: keep table and column names (snake_case) so manual CSV import maps 1:1; keep ids;
add the FKs the code already assumes; fix types only where PostgreSQL forces it or data is clearly wrong.

| Concern                                                                                                                                                    | MariaDB       | PostgreSQL / Prisma                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bigint unsigned` PK auto-increment                                                                                                                        |               | `bigint GENERATED BY DEFAULT AS IDENTITY` (Prisma `BigInt @default(autoincrement())`) — _BY DEFAULT_ so imported ids are accepted; sequences reset after import |
| `int` id columns (`cards.id`, `bookings.service_id`, `booking_details.booking_id`, `memberships.product_id`, `bookings.membership_id`, `bookings.bank_id`) | int           | `bigint`, so FK types match parents                                                                                                                             |
| `tinyint(1)` (`cards.status`)                                                                                                                              |               | `boolean`                                                                                                                                                       |
| `timestamp`                                                                                                                                                | stored as UTC | `timestamptz`                                                                                                                                                   |
| `datetime` (`users.email_verified_at`)                                                                                                                     |               | `timestamptz` (treat source as UTC)                                                                                                                             |
| `date` / `time` (`departure_*`, `dob`)                                                                                                                     |               | `date` / `time` — **wall-clock local Pakistan time, no timezone**                                                                                               |
| `0000-00-00` zero dates                                                                                                                                    |               | `NULL` (or `created_at` for `cards.updated_at`)                                                                                                                 |
| `decimal(15,2)`                                                                                                                                            |               | `numeric(15,2)` (Prisma `Decimal`)                                                                                                                              |
| int money (`total_amount`, `child_price`, …)                                                                                                               | int           | keep `integer` (whole PKR) — **decision needed** whether to unify to `numeric(15,2)`                                                                            |
| `longtext` / `text`                                                                                                                                        |               | `text`                                                                                                                                                          |
| `audit_logs.properties` text JSON, `media.*` JSON                                                                                                          |               | `jsonb`                                                                                                                                                         |
| `memberships.membership_declaration varchar(2)`                                                                                                            | '0'/'1'       | keep `varchar(2)` initially (no behaviour change)                                                                                                               |
| Enum-like ints (`attendee_type`, `memberships.status`)                                                                                                     | int + comment | `smallint` + CHECK constraint, mapped to TS enums in code                                                                                                       |
| latin1 tables                                                                                                                                              |               | UTF-8 (export as utf8mb4)                                                                                                                                       |
| Case-insensitive email uniqueness (MariaDB `_ci` collation)                                                                                                | implicit      | `UNIQUE (lower(email))` index or `citext` — required to preserve behaviour                                                                                      |

### Constraints to add (all existing data was checked and satisfies them unless noted)

- FKs: `bookings.service_id → lounge_services`, `bookings.membership_id → memberships`,
  `bookings.bank_id → cards`, `booking_details.booking_id → bookings`,
  `products.service_id/category_id`, `memberships.product_id`.
- PKs on pivots: `role_user (user_id, role_id)`, `permission_role (role_id, permission_id)`.
- `bookings.code` UNIQUE — **approved: fix the 4 duplicates, then enforce fully.**
  Every other booking has `code = 'ML' || lpad(id, 7, '0')`. The four duplicates are the later row of
  each pair, and their id-based codes are unused, so they are renamed to restore that rule:

  | id  | current code | new code  | note                                                                                                                                      |
  | --- | ------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
  | 34  | ML0000033    | ML0000034 | different customer from id 33                                                                                                             |
  | 58  | ML0000057    | ML0000058 | same customer, flight and passengers as id 57, created 1 s later — a double submission. Kept, not deleted; you may want to soft-delete it |
  | 136 | ML0000135    | ML0000136 | different customer from id 135                                                                                                            |
  | 198 | ML0000197    | ML0000198 | different customer from id 197                                                                                                            |

  Customers of ids 34, 136 and 198 received emails quoting the old code; all four flights are in the past.

- Indexes: `bookings(customer_id)`, `bookings(created_at)`, `bookings(departure_date)`,
  `booking_details(booking_id)`, `memberships(serial_no)`, `memberships(status)`.

### Approved schema changes ([`schema.prisma`](../apps/api/prisma/schema.prisma), [initial migration](../apps/api/prisma/migrations/20261125000000_initial_schema/migration.sql))

- **Added** `booking_details.guardian_contact varchar(100)` — fixes D2.
- **Added** `bookings.idempotency_key` + unique `(customer_id, idempotency_key)` — duplicate-submit protection.
- **Added** tables `refresh_tokens`, `password_reset_tokens` (replace Sanctum tokens and Laravel `password_resets`).
- **Changed** `users.otp` → `users.otp_hash` (+ `otp_attempts`). Existing OTP values are transient and not imported.
- **Changed** `memberships.product_id`, `visit_limit` → nullable (assigned on approval; the NOT NULL made the
  public application form fail). CHECK enforces both are set when `status = 2`.
- **Removed** `cards.services_code`, `cards.visit_type` (approved).
- **Kept** money types as-is (integer PKR / numeric(15,2)); no booking status column.
- **Ids** use PostgreSQL `integer` (largest id < 2,000) rather than bigint, avoiding BigInt handling in JSON.

### Tables not recreated (approved)

Framework: `jobs`, `failed_jobs`, `migrations`, `password_resets`, `personal_access_tokens`.
Unused scaffold: `vouchers`, `majestic_cards`, `product_tags`, `product_product_tag`,
`product_product_category`, `booking_types`, `movements`, `media`. Keep their CSV exports as an archive.
`statuses` is kept (it has live admin CRUD even though bookings don't reference it).

### Supabase Row Level Security

Only the NestJS API (server-side connection string) will access the database. Recommendation:
enable RLS on every table **with no policies**, so the public `anon`/`authenticated` keys and
PostgREST cannot read or write anything. NestJS connects as the `postgres` role (bypasses RLS).
No service-role key is ever shipped to the frontend.

## 5. Manual export / import guide (you perform it)

### Import order (parents before children)

1. `roles`, `permissions`, `source_requests`, `statuses`, `movements`, `nationalities`,
   `lounge_services`, `product_categories`, `membership_types`, `faq_categories`, `cards`
2. `users`, `products`, `faq_questions`
3. `role_user`, `permission_role`, `memberships`
4. `bookings`
5. `booking_details`
6. `audit_logs` (optional; no FKs)

### Export from MariaDB (read-only — never modify the source)

Use a **copy** of the database (restore `backup/new_majestic.sql` into a local MariaDB/MySQL)
rather than the production server. Per table, export CSV with header, UTF-8, `NULL` as empty
unquoted field. phpMyAdmin "Export → CSV" or:

```sql
SELECT ... FROM bookings INTO OUTFILE '/tmp/bookings.csv'
  CHARACTER SET utf8mb4 FIELDS TERMINATED BY ',' ENCLOSED BY '"' ESCAPED BY '"' LINES TERMINATED BY '\n';
```

Before exporting, run these **in the local copy only** (never production):

```sql
-- Zero dates (only the cards table has them)
UPDATE cards SET updated_at = created_at WHERE updated_at = '0000-00-00 00:00:00';

-- membership_id = 0 means "no membership"; 0 would fail the new foreign key
UPDATE bookings SET membership_id = NULL WHERE membership_id = 0;

-- Duplicate booking codes (see §4)
UPDATE bookings SET code = CONCAT('ML', LPAD(id, 7, '0')) WHERE id IN (34, 58, 136, 198);

-- Check: must return 0
SELECT COUNT(*) FROM bookings WHERE code <> CONCAT('ML', LPAD(id, 7, '0'));
```

If your export is newer than the 21 Jul 2026 dump, re-run the duplicate check first:
`SELECT code, COUNT(*) FROM bookings GROUP BY code HAVING COUNT(*) > 1;`

Columns to leave out of the CSVs: `users.otp` (replaced by `otp_hash`), `cards.services_code`, `cards.visit_type`.

### Import into Supabase

1. Create the schema: `pnpm --filter @booking/api prisma:migrate:deploy` — tables empty, constraints and RLS in place.
2. Import per table in the order above (Supabase Table Editor → Import CSV, or `psql \copy`):
   `\copy bookings (id, service_id, ...) FROM 'bookings.csv' WITH (FORMAT csv, HEADER true, NULL '')`
3. Reset identity sequences after import:
   run [`apps/api/prisma/scripts/reset-sequences-after-import.sql`](../apps/api/prisma/scripts/reset-sequences-after-import.sql) once (covers every table; safe to re-run).
4. Values: timestamps are UTC — import as-is into `timestamptz` (session `SET TIME ZONE 'UTC'`).
   `date`/`time` import verbatim. Decimals import verbatim. `cards.status` `0`/`1` imports
   directly into `boolean` (PostgreSQL accepts `0`/`1` as boolean input).
   `audit_logs.properties` must be valid JSON for `jsonb`; any row that fails can be imported with `properties` as NULL.

### Post-import verification queries (Phase 6)

Provided in `migration-plan.md §6`.
