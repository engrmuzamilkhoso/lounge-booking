import { Global, Module } from '@nestjs/common';
import { AdminAuditLogsController } from './admin-audit-logs.controller.js';
import { AuditLogQueriesService } from './audit-log-queries.service.js';
import { AuditService } from './audit.service.js';

@Global()
@Module({
  controllers: [AdminAuditLogsController],
  providers: [AuditService, AuditLogQueriesService],
  exports: [AuditService],
})
export class AuditModule {}
