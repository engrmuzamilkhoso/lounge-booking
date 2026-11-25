import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import type { PaginatedResult } from '../common/pagination/paginated-result.js';
import { AuditLogQueriesService } from './audit-log-queries.service.js';
import { type AuditLogResponse, ListAuditLogsQueryDto } from './audit-log.dto.js';

@ApiTags('Admin: audit logs')
@ApiBearerAuth()
@Controller('admin/audit-logs')
export class AdminAuditLogsController {
  constructor(private readonly auditLogQueriesService: AuditLogQueriesService) {}

  @Get()
  @RequirePermissions('audit_log_access')
  list(@Query() query: ListAuditLogsQueryDto): Promise<PaginatedResult<AuditLogResponse>> {
    return this.auditLogQueriesService.list(query);
  }

  @Get(':id')
  @RequirePermissions('audit_log_show')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AuditLogResponse> {
    return this.auditLogQueriesService.findOne(id);
  }
}
