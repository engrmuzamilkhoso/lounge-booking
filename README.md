# Majestic Booking Management

Replacement for the Laravel Majestic Lounge application: a Next.js website, a NestJS API used by
the website and the mobile app, and a Supabase PostgreSQL database.

Migration status and decisions: [`docs/migration-plan.md`](docs/migration-plan.md).

## Structure

```text
apps/
  api/                  NestJS 12 REST API (Prisma 7, Swagger, pino logging)
    prisma/
      schema.prisma     Database schema (table/column names match the Laravel database)
      migrations/       SQL migrations, applied with `prisma migrate deploy`
      scripts/          One-off SQL scripts (e.g. after the manual data import)
  web/                  Next.js 16 website (App Router, Tailwind CSS 4)
packages/
  shared-types/         Business ids, API response codes and response shapes shared by api and web
docs/                   Analysis, database design, API mapping, migration plan
```

`packages/shared-validation` (Zod schemas shared with the web forms) will be added when the first
form is migrated; an empty package now would only add noise.

## Requirements

- Node.js 24 (`.nvmrc`)
- pnpm 10 — `npm install -g pnpm@10` (or `corepack enable pnpm` from an administrator shell)
- A Supabase project (free tier is fine for development)

## First-time setup

```bash
pnpm install

# API configuration
cp apps/api/.env.example apps/api/.env
# then set DATABASE_URL to the Supabase "Session pooler" connection string

# Web configuration
cp apps/web/.env.example apps/web/.env.local

# Create the tables in Supabase (empty schema, constraints, row level security)
pnpm --filter @booking/api prisma:migrate:deploy
```

### Supabase connection string

Supabase dashboard → **Connect** → **Session pooler**. It looks like:

```text
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

Use the session pooler rather than the direct connection: the direct host is IPv6-only, which
many Windows/ISP networks cannot reach. The session pooler works for both the API and migrations.

The API connects as the database owner. Row level security is enabled on every table with no
policies, so Supabase's public `anon` key cannot read or write data. Never put the database URL or
the Supabase service-role key in the web app's environment.

## Running locally

```bash
pnpm dev:api    # http://localhost:4000/api/v1  — Swagger UI at http://localhost:4000/api/docs
pnpm dev:web    # http://localhost:3000
```

Run each in its own terminal. Check the API and database connection with
`GET http://localhost:4000/api/v1/health`.

The website needs `apps/web/.env.local` (copy `apps/web/.env.example`); `API_URL` must point at the
API. The browser never calls the API directly: session tokens live in httpOnly cookies and the
Next.js server calls the API on the user's behalf.

## Google Sign-In

Optional. Without a Client ID the Google button is simply not shown.

1. Google Cloud Console → **APIs & Services → OAuth consent screen**: set up the app (External,
   app name "Majestic Lounge", support email, authorised domain `majestic.com.pk`).
2. **Credentials → Create credentials → OAuth client ID → Web application.**
3. **Authorised JavaScript origins:** `http://localhost:3000` for development and the production
   site URL (e.g. `https://majestic.com.pk`). No redirect URIs are needed — the button uses a popup.
4. Copy the **Client ID** (ends in `.apps.googleusercontent.com`) into both:
   - `apps/api/.env` → `GOOGLE_CLIENT_ID=…` (the API verifies tokens were issued for this client)
   - `apps/web/.env.local` → `NEXT_PUBLIC_GOOGLE_CLIENT_ID=…` (renders the button)
5. Restart both apps.

No client secret is used: Google returns a signed ID token to the browser, and the API verifies
its signature, issuer, audience and expiry with Google's public keys. Accounts are matched by the
Google account id, then by Google-verified email (which links the existing account). The Google
profile picture is stored and shown in the account menu. Closing the Google popup simply leaves
the visitor on the sign-in page.

**Testing:** with the Client ID configured, open `/signin` → "Sign in with Google":
a new Google account creates a Customer (CNIC and phone are left empty for now); an
email that already has a password account is linked and signed in; signing out and back in with
Google reuses the same account (no duplicates).

## Safepay payments

Bookings with a price are paid online through Safepay's hosted checkout; free bookings
(bank-card lounge access, membership visits) are confirmed immediately. Leave the Safepay keys
empty to disable online payments (paid bookings then stay "awaiting payment").

### Sandbox setup

1. Create a sandbox account: <https://sandbox.api.getsafepay.com/dashboard> (separate from live).
2. **Developers → API keys:** copy the public API key and the secret key into `apps/api/.env`:
   `SAFEPAY_API_KEY`, `SAFEPAY_SECRET_KEY`, and keep `SAFEPAY_ENVIRONMENT=sandbox`.
3. **Developers → Endpoints → Add an endpoint:** `https://<api-host>/api/v1/payments/safepay/webhook`,
   subscribe to `payment.succeeded`, `payment.failed` and `payment.refunded` (event version 2.0.0),
   then copy **View shared secret** into `SAFEPAY_WEBHOOK_SECRET`. Locally, expose the API with a
   tunnel (e.g. `ngrok http 4000`) to receive webhooks; without them payments are still confirmed
   when the customer returns from Safepay.
4. Restart the API. Secrets stay in `apps/api/.env` only — the website never sees them.

### How a payment works

1. The customer books; a booking with a price is saved as **awaiting payment**.
2. **Pay** on the checkout page → `POST /bookings/:id/checkout`. The API takes the amount from
   the stored booking (never from the browser), creates a Safepay payment session
   (`POST /order/payments/v3/`, amount in paisa), gets a checkout token
   (`POST /client/passport/v1/token`) and returns the hosted checkout URL. Clicking Pay again
   reuses the same session, so a customer cannot be charged twice.
3. The customer pays on Safepay and is sent back to `/checkout/:id/complete?tracker=…`.
4. The API verifies with Safepay (`GET /reporter/api/v1/payments/:tracker`): only
   `TRACKER_ENDED` with the expected amount and currency marks the booking **paid**. The
   confirmation email is then sent once.
5. Webhooks (signed with HMAC-SHA512, header `x-sfpy-signature`) trigger the same verification,
   so payments are confirmed even if the customer closes the browser. Repeated webhooks are harmless.

Cancelling on Safepay returns to the checkout page with the booking still reserved; a failed
card marks the attempt failed and the customer can try again. Refunds made in the Safepay
dashboard are picked up from the `payment.refunded` webhook (refunds are not issued from this app).

### Testing payments (sandbox)

Use Safepay's sandbox test cards (any future expiry, any CVV):

| Result                                 | Card number                                    |
| -------------------------------------- | ---------------------------------------------- |
| Successful payment                     | `4456 5300 0000 1005` or `5200 0000 0000 1005` |
| Successful with 3-D Secure step-up     | `4000 0000 0000 2503`                          |
| Declined (unsuccessful authentication) | `4456 5300 0000 1013` or `5200 0000 0000 1013` |

Book a Meet & Assist service (it has a price), pay with a card above and check: the result page,
**My bookings** (status _Paid_), the payment row in the `payments` table and the confirmation
email in the API log (or inbox). For a failure, use a declined card and then retry with a
successful one.

### Switching to production

1. Create/verify the live Safepay merchant account and complete KYC.
2. In `apps/api/.env` set `SAFEPAY_ENVIRONMENT=production` and the **live** `SAFEPAY_API_KEY`,
   `SAFEPAY_SECRET_KEY` (from the live dashboard, <https://getsafepay.com/dashboard>).
3. Register the production webhook endpoint (HTTPS on port 443) in the live dashboard and set
   its shared secret as `SAFEPAY_WEBHOOK_SECRET`.
4. Set `WEB_URL` to the public website URL (it builds the return and cancel URLs).
5. Make one small real payment and refund it from the Safepay dashboard to confirm the setup.

## Common commands

| Command                                                     | What it does                                 |
| ----------------------------------------------------------- | -------------------------------------------- |
| `pnpm lint`                                                 | ESLint in every package                      |
| `pnpm typecheck`                                            | TypeScript strict checks in every package    |
| `pnpm format` / `pnpm format:check`                         | Prettier                                     |
| `pnpm build`                                                | Production build of packages, API and web    |
| `pnpm --filter @booking/api prisma:generate`                | Regenerate the Prisma client                 |
| `pnpm --filter @booking/api prisma:migrate:dev -- --name x` | Create a new migration after a schema change |
| `pnpm --filter @booking/api prisma:studio`                  | Browse the database                          |

## API response format

Every response uses the same envelope (the mobile app checks `status`):

```json
{ "status": "0000", "message": "Success", "data": {} }
{ "status": "0005", "message": "Missing-Parameters", "errors": { "flightNumber": ["required"] } }
```

Codes are defined once in `packages/shared-types/src/response-codes.ts` and listed in
`docs/api-mapping.md`. HTTP status codes are also correct (201, 401, 404, 422, …).

## Data import

The Laravel data is imported manually. Follow `docs/database-analysis.md` §5: clean a local copy,
export CSVs, import in the listed order, then run
`apps/api/prisma/scripts/reset-sequences-after-import.sql` once.
