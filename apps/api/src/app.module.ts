import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AccessControlModule } from './access-control/access-control.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { MembershipsModule } from './memberships/memberships.module.js';
import { AllExceptionsFilter } from './common/http/all-exceptions.filter.js';
import { ResponseEnvelopeInterceptor } from './common/http/response-envelope.interceptor.js';
import { type Environment, validateEnvironment } from './config/environment.js';
import { HealthModule } from './health/health.module.js';
import { MailModule } from './mail/mail.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';

/** Default per-IP request limit; auth endpoints set stricter limits with @Throttle. */
const DEFAULT_RATE_LIMIT = { ttl: 60_000, limit: 120 };

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Environment, true>) => {
        const isDevelopment = configService.get('NODE_ENV', { infer: true }) === 'development';
        return {
          pinoHttp: {
            level: configService.get('LOG_LEVEL', { infer: true }),
            // Readable logs locally, JSON lines in production.
            transport: isDevelopment ? { target: 'pino-pretty' } : undefined,
            // Never log credentials or tokens. Request bodies are not logged at all.
            redact: ['req.headers.authorization', 'req.headers.cookie'],
          },
        };
      },
    }),
    ThrottlerModule.forRoot([DEFAULT_RATE_LIMIT]),
    PrismaModule,
    MailModule,
    AuditModule,
    AccessControlModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    MembershipsModule,
    BookingsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
  ],
})
export class AppModule {}
