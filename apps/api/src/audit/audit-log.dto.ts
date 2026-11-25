import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import type { Prisma } from '../generated/prisma/client.js';

export interface AuditLogResponse {
  id: number;
  /** audit:created, audit:updated or audit:deleted */
  description: string;
  subjectId: number | null;
  /** e.g. "Booking#201" (Laravel entries: "App\Models\Booking#201") */
  subjectType: string | null;
  userId: number | null;
  /** Full record for created/deleted; only the changed fields for updated. */
  properties: Prisma.JsonValue;
  host: string | null;
  createdAt: string | null;
}

/** `search` matches the subject (e.g. "Booking#201") and the description. */
export class ListAuditLogsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  userId?: number;
}
