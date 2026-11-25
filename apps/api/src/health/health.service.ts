import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ResponseCode } from '@booking/shared-types';
import { AppException } from '../common/http/app.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface HealthStatus {
  api: 'ok';
  database: 'ok';
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStatus(): Promise<HealthStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      throw new AppException(ResponseCode.ServerError, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return { api: 'ok', database: 'ok' };
  }
}
