import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7 does not load .env files by itself; dotenv/config above does it for the CLI.
//
// The datasource is optional so that `prisma generate` (used by build and typecheck) works
// without database credentials, e.g. in CI or a Docker build. Commands that connect
// (migrate, studio) stop with "datasource is required" when DATABASE_URL is missing.
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: databaseUrl ? { url: databaseUrl } : undefined,
});
