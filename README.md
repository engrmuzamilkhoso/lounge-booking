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
