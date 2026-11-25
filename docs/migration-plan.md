# Migration Plan — Laravel → Next.js + NestJS + Supabase PostgreSQL

Status: **awaiting approval**. No implementation has started.

## 1. Recommended approach

The application is small (one core workflow, ~10 real entities) but has security defects and
schema drift. Recommendation: **rebuild alongside, cut over once** — not a strangler/proxy
migration. Running Laravel and NestJS against two different databases at the same time would
need data synchronisation, which is out of scope.

- Build the new monorepo **in a separate folder** (proposed `d:\projects\booking-management`), so the
  Laravel code is never modified.
- Laravel stays in production until the new system is verified, then a short freeze → final manual
  export/import → DNS switch.
- Preserve behaviour, ids and data; fix only the defects you approve (§4).

## 2. Target architecture

```
booking-management/
├── apps/
│   ├── api/   NestJS 11, Prisma, Swagger, JWT, nodemailer, pino logging
│   └── web/   Next.js (App Router), Tailwind, React Hook Form, Zod, TanStack Query
├── packages/
│   ├── shared-types/        enums (AttendeeType, MembershipStatus, ServiceId…), DTO shapes
│   └── shared-validation/   Zod schemas used by web forms (API uses class-validator DTOs)
├── docs/
├── docker-compose.yml       api + web for local parity (DB stays on Supabase cloud)
├── pnpm-workspace.yaml
└── package.json
```

No Turborepo initially — two apps and two small packages don't need it; pnpm filters are enough.

### NestJS modules (derived from actual features)

`auth`, `users`, `access-control` (roles/permissions), `catalog` (services, categories, products,
cards, membership types), `memberships`, `bookings` (incl. attendees, pricing, code generation),
`inquiries`, `content` (FAQ), `lookups` (nationalities, statuses, source requests),
`dashboard`, `audit`, `mail`, plus `common` (Prisma, errors, pagination, logging).

### Key technical decisions

| Topic             | Decision                                                                                                                                                               | Reason                                                                                                                                                                                                                                                                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth              | **NestJS-issued JWT** (access ~15 min + rotating refresh token, httpOnly cookie for web, bearer for mobile) against the existing `users` table. **Not Supabase Auth.** | Existing bcrypt `$2y$` hashes verify directly with the `bcrypt` npm package (same algorithm), so every user keeps their password with zero resets. Existing RBAC (roles/permissions tables) stays authoritative. Supabase Auth would require importing hashes into `auth.users`, a second user table, and re-wiring RBAC, for no feature gain. |
| Authorization     | Permission guard using the same 123 permission titles                                                                                                                  | Admin screens and roles keep working identically                                                                                                                                                                                                                                                                                               |
| DB access         | Prisma; Supabase used as managed Postgres only                                                                                                                         | RLS enabled with no policies (deny-all for anon/authenticated keys)                                                                                                                                                                                                                                                                            |
| Booking code      | Generated inside the booking transaction from a dedicated Postgres sequence, formatted `ML` + 7 digits, UNIQUE for new rows                                            | Fixes duplicate codes, keeps the format                                                                                                                                                                                                                                                                                                        |
| Price             | Recomputed server-side with the existing formula; client total is display-only                                                                                         | Closes tampering (S5) without changing prices                                                                                                                                                                                                                                                                                                  |
| Duplicate submits | `Idempotency-Key` header on `POST /bookings` + disabled submit button                                                                                                  | Requirement; today duplicates are possible                                                                                                                                                                                                                                                                                                     |
| Membership visits | Re-checked inside the booking transaction with `SELECT … FOR UPDATE` on the membership row                                                                             | Prevents over-use under concurrency                                                                                                                                                                                                                                                                                                            |
| Mail              | nodemailer + templates ported from Blade; sent via a Postgres-backed queue (`pg-boss`)                                                                                 | Keeps async sending and retries without adding Redis                                                                                                                                                                                                                                                                                           |
| Audit log         | Prisma client extension writing `audit_logs` on create/update/delete for the same models                                                                               | Preserves A16                                                                                                                                                                                                                                                                                                                                  |
| Timezone          | `timestamptz` in UTC; flight `date`/`time` stored as local wall-clock; UI shows `Asia/Karachi`                                                                         | Matches current data                                                                                                                                                                                                                                                                                                                           |
| Frontend styling  | Tailwind, recreating current public look; admin rebuilt as a clean table/form UI with the same columns/actions                                                         | See decision Q7                                                                                                                                                                                                                                                                                                                                |

## 3. Phases

| Phase | Work                                                                                                          | Output                                          | Gate                              |
| ----- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------- |
| 1–2   | Analysis & documentation                                                                                      | these 5 docs                                    | **your approval**                 |
| 3     | Prisma schema + design decisions from §4                                                                      | `schema.prisma`, updated `database-analysis.md` | approval                          |
| 4     | Monorepo skeleton: pnpm, TS strict, ESLint, Prettier, Next + Nest hello-world, `.env.example`, docker-compose | runnable empty apps                             | —                                 |
| 5     | Supabase project, Prisma migrate, RLS, seed lookups for local dev                                             | empty schema in Supabase                        | —                                 |
| 6     | **You** export/import data                                                                                    | —                                               | verification queries (§6) pass    |
| 7a    | API: auth + users + access-control                                                                            | login works with existing passwords             | manual check                      |
| 7b    | API: catalog + memberships                                                                                    |                                                 |                                   |
| 7c    | API: bookings (create/list/detail/admin), mail, audit                                                         |                                                 |                                   |
| 7d    | API: dashboard, inquiries, FAQ, lookups, admin CRUD                                                           |                                                 |                                   |
| 8a    | Web: public pages + auth pages                                                                                |                                                 |                                   |
| 8b    | Web: booking flow (services → products → form → thank-you), my bookings                                       |                                                 | side-by-side compare with Laravel |
| 8c    | Web: membership pages                                                                                         |                                                 |                                   |
| 8d    | Web: admin panel                                                                                              |                                                 |                                   |
| 9     | Auth hardening: refresh rotation, OTP flow, password reset, rate limits                                       |                                                 |                                   |
| 10    | Integration polish, error/empty/loading states                                                                |                                                 |                                   |
| 11    | Manual verification against Laravel (checklist §7)                                                            | signed-off checklist                            | your sign-off                     |
| 12    | Production prep: Dockerfiles, Caddy, DigitalOcean runbook, cut-over plan                                      | no deploy until you say so                      |                                   |

Each sub-phase is a small, reviewable change set.

## 4. Decisions

### Recorded answers (25 Nov 2026)

| Topic                                       | Decision                                                                                                                                                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mobile app                                  | Will be built against the **NestJS** API. Laravel is retired, so it won't be patched and needs no legacy adapter. The API follows the Laravel mobile API's flows and `{status, message, data}` envelope, with proper HTTP codes (see `api-mapping.md`) |
| Password reset fix                          | Approved — OTP verify returns a reset token; reset requires it                                                                                                                                                                                         |
| Guardian contact + server-side price        | Approved                                                                                                                                                                                                                                               |
| Duplicate booking codes                     | Do **not** keep as-is → later row of each pair renamed to its id-based code; `code` fully UNIQUE                                                                                                                                                       |
| Unused scaffold entities                    | Drop (booking types, movements, vouchers, majestic cards, product tags, media)                                                                                                                                                                         |
| UI                                          | Public site faithful to current design; admin rebuilt in Tailwind with identical features                                                                                                                                                              |
| `cards.services_code`, `cards.visit_type`   | Remove                                                                                                                                                                                                                                                 |
| Money types, booking status, WhatsApp table | Defaults applied: keep current money types; no status column; keep `whatsapp_booking` as the Laravel code defines it                                                                                                                                   |
| Monorepo location                           | Separate repo `d:\projects\booking-management`                                                                                                                                                                                                         |

### Original questions

| #   | Question                                                                                                      | My recommendation                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Q1  | Is the mobile app live and must it keep working **without an app update**?                                    | If yes: keep a thin legacy adapter with the old URLs/envelope (except the insecure reset). If no: only new REST API. |
| Q2  | Fix the password-reset vulnerability (requires mobile app change to send a reset token)?                      | **Yes, mandatory.** Also recommend patching Laravel production now — it is exploitable today.                        |
| Q3  | Save child/infant **guardian contact** (currently dropped)?                                                   | Yes — add column                                                                                                     |
| Q4  | Recompute booking price server-side?                                                                          | Yes (same formula)                                                                                                   |
| Q5  | Duplicate booking codes (4 exist): keep as-is with uniqueness only for new rows, or rename?                   | Keep as-is; enforce for new rows                                                                                     |
| Q6  | Drop unused scaffold entities (booking types, movements, vouchers, majestic cards, product tags, media)?      | Drop from the new app; keep their CSVs archived                                                                      |
| Q7  | Admin UI: faithful CoreUI look, or clean Tailwind admin with identical features? Public site: pixel-faithful? | Public: faithful. Admin: same features, clean Tailwind UI                                                            |
| Q8  | Money columns: keep `integer` PKR, or unify all to `numeric(15,2)`?                                           | Keep integers where they are integers today; no behaviour change                                                     |
| Q9  | Booking status / cancellation — does not exist today. Add?                                                    | Not now; out of scope unless you want it                                                                             |
| Q10 | WhatsApp booking endpoint — table never created in prod. Keep?                                                | Clarify intended use first                                                                                           |
| Q11 | Location of new monorepo                                                                                      | Separate folder `d:\projects\booking-management`                                                                     |
| Q12 | Meaning of `cards.services_code` and `cards.visit_type`                                                       | Keep columns; need business meaning before using them                                                                |

### Behaviour differences introduced during implementation (for review)

Each is either a security fix or something Laravel did not have. Everything else keeps Laravel's rules.

| Area                                    | Laravel                                                              | New API                                                                                                          | Why                                                                  |
| --------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Change own password                     | No current-password check                                            | `currentPassword` required                                                                                       | Stolen session can't lock the owner out                              |
| Change / reset password                 | Other sessions stay signed in                                        | All sessions signed out                                                                                          | Standard after a credential change                                   |
| Profile (`/me`)                         | Admin-only page (`profile_password_edit`), name + email              | Every signed-in user; first/last name, email, contact (CNIC read-only)                                           | Needed by the mobile app                                             |
| OTP                                     | Plain text, no attempt limit, unknown email → `0007`                 | Hashed, 5 attempts, unknown email answers like a known one                                                       | Brute-force and account-discovery protection                         |
| Login / OTP / register / reset          | Unlimited                                                            | Rate-limited per IP (10/min credentials, 5/min email-sending)                                                    | Brute-force and email-spam protection                                |
| Mobile logout                           | Revoked all of the user's tokens                                     | `/auth/logout` ends this device; `/auth/logout-all` keeps the old behaviour                                      | Logging out on the phone shouldn't end the website session           |
| Queued email                            | DB queue + cron worker                                               | Sent directly after the data is saved; failures logged, request still succeeds                                   | No worker process to keep alive; Laravel's queue had 87 failed jobs  |
| Registration welcome email              | Sent to staff only                                                   | Sent to staff **and** the new customer                                                                           | Decided 25 Nov 2026                                                  |
| Money in responses                      | Mix of `"4000.00"` strings and integers                              | Every amount is a JSON number                                                                                    | One consistent type for the new app                                  |
| Website membership application          | Insert failed (NOT NULL product/visit limit)                         | Works; saved as pending                                                                                          | Fixed by approved schema change                                      |
| Admin "create membership"               | Rules required name of exactly 50 and email of exactly 20 characters | Normal required/max-length rules                                                                                 | Laravel rules were unusable                                          |
| Membership approval                     | No checks on serial number, product or visit limit                   | Serial must be unused, product must be a membership product (category 3), visit limit ≥ 1                        | Prevents two memberships with one number                             |
| Membership verification                 | Returned `0`/`1`/`2`; stored membership in the session               | `0013` not found / `0014` limit reached / remaining visits; booking re-checks                                    | Stateless API                                                        |
| Product guest price                     | Column existed but admin form could not set it                       | Editable in admin product form                                                                                   | Premier product uses it                                              |
| Membership-type, card, membership edits | Audited                                                              | Audited (same `audit:created/updated/deleted` entries)                                                           | Same as Laravel                                                      |
| Booking price                           | Computed in the browser and trusted                                  | Computed by the API with the same formula; client sends the total it showed and gets `0019` if it differs        | Price tampering                                                      |
| Booking code                            | `ML` + (last id + 1), duplicates possible                            | `ML` + the booking's own id, reserved inside the transaction                                                     | 4 duplicates existed in production                                   |
| Duplicate submit                        | Second booking created                                               | Optional `Idempotency-Key` header returns the first booking                                                      | Double-click / app retry                                             |
| Membership visit limit                  | Checked only by the verify call                                      | Re-checked while saving, with the membership row locked                                                          | Concurrent bookings could exceed the limit                           |
| Membership on booking                   | Membership page only                                                 | Required for Membership-service products, rejected for others                                                    | Same flow, enforced on the server                                    |
| Departure date                          | No check                                                             | Customers cannot book a date before today (Pakistan time); staff can                                             | Decided 25 Nov 2026                                                  |
| Adults                                  | Counter could reach 0                                                | At least 1 adult per booking                                                                                     | Decided 25 Nov 2026                                                  |
| Guests                                  | Premier only, from the form                                          | Only for products with a guest price                                                                             | Same rule, enforced on the server                                    |
| Guardian contact                        | Collected, never saved                                               | Saved                                                                                                            | Approved schema change                                               |
| Booking source                          | Web = 1 always on web, App = 2 on API                                | Client sends `platform: web \| app`                                                                              | One endpoint for both                                                |
| Admin create/edit booking               | Broken (non-existent relations/columns)                              | Create: same rules as customers, past dates allowed, no email. Edit: flight number/detail, date, time, bank card | Restores the admin feature                                           |
| Admin passengers                        | Add/edit/delete; counts not updated                                  | Add/edit/delete; adult/child/infant counts kept in step; total not recalculated                                  | Keeps counts consistent                                              |
| My bookings                             | No login check on the routes                                         | Login required; another customer's booking returns 404                                                           | Security fix                                                         |
| Contact inquiry email                   | Sent to staff and to the address typed in the form; no validation    | Same recipients (staff + submitter); name, email and message required; 5 per minute per IP; honeypot kept        | Decided 25 Nov 2026 — the rate limit restricts abuse as a mail relay |
| Dashboard "latest bookings"             | Query without ordering returned the oldest 50                        | Newest 10                                                                                                        | Bug fix (widget configured for 10 latest)                            |
| Dashboard access                        | Role id 1 (Admin)                                                    | `dashboard` permission (only Admin has it)                                                                       | Same people, permission-based                                        |
| Admin global search                     | Model list empty — always returned nothing                           | Not built                                                                                                        | Never worked; build later if wanted                                  |
| WhatsApp bookings                       | Endpoint existed, table missing                                      | Works with the same fields; no admin screen (none existed)                                                       | Approved                                                             |

Data notes:

- Permission `booking_orders` (id 123) is soft-deleted in Laravel, so 122 permissions are active.
- Bank cards: the booking form lists only active cards and new bookings reject inactive ones; staff still see and can edit all cards (decided 25 Nov 2026).
- Memberships are corporate and not tied to a user account (one has a 3,333-visit limit), so the earlier finding "doesn't check the membership belongs to the user" is withdrawn.

## 5. Risks

| Risk                                                                          | Mitigation                                                                                             |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Hidden behaviour in Blade/JS not captured                                     | Side-by-side manual comparison per page in Phase 11                                                    |
| Hard-coded ids (services 1–4, categories 1–3, roles 1/2, sources 1/2)         | Preserve ids on import; centralise as named constants in `shared-types`                                |
| Mobile app built before the API is stable                                     | Build API phases 7a–7c first; Swagger at `/api/docs` is the contract the app developer works from      |
| Laravel keeps running in production until cut-over with known vulnerabilities | Keep the cut-over short; until then, consider disabling the mobile `resetPassword` route on the server |
| Password compatibility                                                        | `$2y$` bcrypt verified in Phase 7a against a test account before anything else                         |
| Zero-dates / latin1 tables break import                                       | Clean in the export copy (see `database-analysis.md §5`)                                               |
| Email deliverability (87 failed jobs today)                                   | Verify SMTP credentials and SPF early; log send failures                                               |
| Secrets committed in the Laravel repo                                         | Rotate cPanel/SMTP/DB/OAuth credentials; never copy those files into the new repo                      |
| PII in committed SQL dumps                                                    | Keep dumps out of the new repo (`.gitignore`)                                                          |

## 6. Post-import verification queries (Phase 6)

Expected counts are from the 21 Jul 2026 dump; your export will be newer.

```sql
-- Record counts
SELECT 'users', count(*) FROM users UNION ALL
SELECT 'bookings', count(*) FROM bookings UNION ALL
SELECT 'booking_details', count(*) FROM booking_details UNION ALL
SELECT 'memberships', count(*) FROM memberships UNION ALL
SELECT 'products', count(*) FROM products UNION ALL
SELECT 'cards', count(*) FROM cards UNION ALL
SELECT 'role_user', count(*) FROM role_user;
-- dump reference: users 737, bookings 179, booking_details 329, memberships 6, products 11, cards 70, role_user 737

-- Orphans (all must return 0)
SELECT count(*) FROM booking_details d LEFT JOIN bookings b ON b.id = d.booking_id WHERE b.id IS NULL;
SELECT count(*) FROM bookings b LEFT JOIN users u ON u.id = b.customer_id WHERE b.customer_id IS NOT NULL AND u.id IS NULL;
SELECT count(*) FROM bookings b LEFT JOIN cards c ON c.id = b.bank_id WHERE b.bank_id IS NOT NULL AND c.id IS NULL;
SELECT count(*) FROM role_user ru LEFT JOIN users u ON u.id = ru.user_id WHERE u.id IS NULL;

-- Duplicates
SELECT code, count(*) FROM bookings GROUP BY code HAVING count(*) > 1;           -- expect the 4 known
SELECT lower(email), count(*) FROM users GROUP BY lower(email) HAVING count(*) > 1; -- expect 0

-- Money (compare with the same query on MariaDB)
SELECT count(*), sum(total_amount) FROM bookings WHERE deleted_at IS NULL;
SELECT sum(price), sum(child_price), sum(infant_price) FROM products;

-- Passenger counts consistent with attendee rows
SELECT b.id, b.adult_qty + coalesce(b.child_qty,0) + coalesce(b.infant_qty,0) AS declared, count(d.id) AS rows
FROM bookings b LEFT JOIN booking_details d ON d.booking_id = b.id
GROUP BY b.id HAVING b.adult_qty + coalesce(b.child_qty,0) + coalesce(b.infant_qty,0) <> count(d.id);

-- Dates/timezones: compare a few known rows field-by-field with MariaDB
SELECT id, code, departure_date, departure_time, created_at AT TIME ZONE 'UTC' FROM bookings ORDER BY id DESC LIMIT 5;

-- Sequences advanced past imported ids
SELECT max(id), (SELECT last_value FROM bookings_id_seq) FROM bookings;
```

## 7. Manual verification checklist (Phase 11)

- [ ] Existing customer logs in with old password (web + mobile)
- [ ] Admin logs in; menu shows same modules; non-admin blocked from dashboard
- [ ] Register → role Customer → staff email received
- [ ] Each service page shows the same products and prices as Laravel
- [ ] Price for sample passenger mixes matches Laravel (incl. child/infant limits, guests)
- [ ] Lounge booking requires bank card; others don't
- [ ] Membership verify: not found / limit exceeded / ok
- [ ] Booking created with `ML` code, attendees saved, emails sent to staff + customer
- [ ] Double-click / resubmit does not create two bookings
- [ ] My bookings shows only own bookings
- [ ] Membership application → pending → admin approve assigns next serial
- [ ] Admin CRUD for each kept module; audit log entries written
- [ ] Dashboard numbers equal Laravel's for the same data
- [ ] OTP request/verify/reset works and reset without OTP is rejected

## 8. Progress checklist

- [x] Phase 1 — Analysis
- [x] Phase 2 — Documentation
- [x] Phase 3 — Schema design (approved 25 Nov 2026)
- [x] Phase 4 — Monorepo setup (Docker files moved to Phase 12)
- [x] Phase 5 — Supabase + Prisma (schema migrated 25 Nov 2026; 22 tables, RLS on, anon locked out)
- [ ] Phase 6 — Data import (you)
- [x] Phase 7 — API modules (auth, users, roles, catalog, memberships, bookings, lookups, FAQ, inquiries, dashboard, audit log, WhatsApp bookings)
- [ ] Phase 8 — Frontend
- [ ] Phase 9 — Auth hardening
- [ ] Phase 10 — Integration
- [ ] Phase 11 — Verification
- [ ] Phase 12 — Production prep
