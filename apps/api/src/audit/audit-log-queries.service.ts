import { Injectable } from '@nestjs/common';
import { recordNotFound } from '../common/http/not-found.js';
import { PaginatedResult } from '../common/pagination/paginated-result.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuditLogResponse, ListAuditLogsQueryDto } from './audit-log.dto.js';

const auditLogSelect = {
  id: true,
  description: true,
  subjectId: true,
  subjectType: true,
  userId: true,
  properties: true,
  host: true,
  createdAt: true,
} satisfies Prisma.AuditLogSelect;

type AuditLogRecord = Prisma.AuditLogGetPayload<{ select: typeof auditLogSelect }>;

/** Read side of the audit trail (Laravel "Audit Logs" screens). */
@Injectable()
export class AuditLogQueriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Newest first. */
  async list(query: ListAuditLogsQueryDto): Promise<PaginatedResult<AuditLogResponse>> {
    const where: Prisma.AuditLogWhereInput = { userId: query.userId };
    if (query.search !== undefined && query.search !== '') {
      const contains = { contains: query.search, mode: 'insensitive' as const };
      where.OR = [{ subjectType: contains }, { description: contains }];
    }

    const [entries, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        select: auditLogSelect,
        orderBy: { id: 'desc' },
        skip: query.skip,
        take: query.pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return PaginatedResult.of(entries.map(toAuditLogResponse), total, query);
  }

  async findOne(id: number): Promise<AuditLogResponse> {
    const entry = await this.prisma.auditLog.findUnique({ where: { id }, select: auditLogSelect });
    if (entry === null) {
      throw recordNotFound();
    }
    return toAuditLogResponse(entry);
  }
}

function toAuditLogResponse(entry: AuditLogRecord): AuditLogResponse {
  return {
    id: entry.id,
    description: entry.description,
    subjectId: entry.subjectId,
    subjectType: entry.subjectType,
    userId: entry.userId,
    properties: entry.properties,
    host: entry.host,
    createdAt: entry.createdAt === null ? null : entry.createdAt.toISOString(),
  };
}
