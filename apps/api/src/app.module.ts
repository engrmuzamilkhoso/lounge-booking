import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/http/all-exceptions.filter.js';
import { ResponseEnvelopeInterceptor } from './common/http/response-envelope.interceptor.js';
import { type Environment, validateEnvironment } from './config/environment.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

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
            // Never log credentials or tokens.
            redact: ['req.headers.authorization', 'req.headers.cookie'],
          },
        };
      },
    }),
    PrismaModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
  ],
})
export class AppModule {}
