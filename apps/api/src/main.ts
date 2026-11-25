import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { createValidationPipe } from './common/validation/create-validation-pipe.js';
import type { Environment } from './config/environment.js';

const API_PREFIX = 'api/v1';
const SWAGGER_PATH = 'api/docs';

async function bootstrap(): Promise<void> {
  // rawBody: Safepay webhook signatures are checked against the exact bytes received.
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
  const configService = app.get<ConfigService<Environment, true>>(ConfigService);

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(createValidationPipe());
  app.enableCors({
    origin: configService.get('CORS_ORIGINS', { infer: true }),
    credentials: true,
  });
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Majestic Booking API')
    .setDescription('API for the Majestic website and mobile app')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(SWAGGER_PATH, app, () => SwaggerModule.createDocument(app, swaggerConfig));

  const port = configService.get('PORT', { infer: true });
  await app.listen(port);
  app.get(Logger).log(`API listening on http://localhost:${port}/${API_PREFIX}`);
}

await bootstrap();
