import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from '../generated/prisma/client.js';
import type { Environment } from '../config/environment.js';

/**
 * Prisma client on a node-postgres pool.
 *
 * Every connection is switched to UTC. The Prisma pg adapter sends timestamps without a time
 * zone; Postgres interprets those in the session's zone, so on a server not set to UTC every
 * stored time would be shifted (5 hours on a Pakistan-configured server) while still looking
 * right to the application. Supabase runs in UTC, but correctness should not depend on that.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: pg.Pool;

  constructor(configService: ConfigService<Environment, true>) {
    const pool = new pg.Pool({
      connectionString: configService.get('DATABASE_URL', { infer: true }),
    });
    pool.on('connect', (client) => {
      client.query("SET TIME ZONE 'UTC'").catch((error: unknown) => {
        // Logged rather than thrown: an event handler cannot fail the pending query.
        Logger.error(
          { err: error },
          'Could not set the database session time zone to UTC',
          'PrismaService',
        );
      });
    });
    super({ adapter: new PrismaPg(pool) });
    this.pool = pool;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    const rows = await this.$queryRaw<{ TimeZone: string }[]>`SHOW TIME ZONE`;
    this.logger.log({ timeZone: rows[0]?.TimeZone }, 'Database session time zone');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
  }
}
