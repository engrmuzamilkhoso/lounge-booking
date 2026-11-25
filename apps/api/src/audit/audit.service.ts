import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuditActor } from './audit-actor.js';

/** Same descriptions Laravel's Auditable trait wrote, so old and new entries read alike. */
export type AuditAction = 'audit:created' | 'audit:updated' | 'audit:deleted';

/** Models Laravel audited (those using the Auditable trait) that exist in the new system. */
export type AuditedModel =
  | 'Booking'
  | 'BookingDetail'
  | 'Card'
  | 'Membership'
  | 'MembershipType'
  | 'Nationality'
  | 'SourceRequest'
  | 'Status';

type AuditWriter = Pick<PrismaService, 'auditLog'> | Prisma.TransactionClient;

/**
 * Writes `audit_logs` rows, replacing Laravel's Auditable trait:
 * - created / deleted: the full record
 * - updated: only the fields that changed (new values)
 *
 * Pass the transaction client when the change runs in a transaction, so the audit entry is
 * committed or rolled back together with the change.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async recordCreated(
    model: AuditedModel,
    record: { id: number },
    actor: AuditActor,
    writer: AuditWriter = this.prisma,
  ): Promise<void> {
    await this.write(writer, 'audit:created', model, record.id, record, actor);
  }

  /** Records nothing when no field actually changed (Laravel only fires on real changes). */
  async recordUpdated(
    model: AuditedModel,
    before: { id: number } & Record<string, unknown>,
    after: { id: number } & Record<string, unknown>,
    actor: AuditActor,
    writer: AuditWriter = this.prisma,
  ): Promise<void> {
    const changes = changedFields(before, after);
    if (Object.keys(changes).length === 0) {
      return;
    }
    await this.write(writer, 'audit:updated', model, after.id, changes, actor);
  }

  async recordDeleted(
    model: AuditedModel,
    record: { id: number },
    actor: AuditActor,
    writer: AuditWriter = this.prisma,
  ): Promise<void> {
    await this.write(writer, 'audit:deleted', model, record.id, record, actor);
  }

  private async write(
    writer: AuditWriter,
    action: AuditAction,
    model: AuditedModel,
    subjectId: number,
    properties: object,
    actor: AuditActor,
  ): Promise<void> {
    await writer.auditLog.create({
      data: {
        description: action,
        subjectId,
        subjectType: `${model}#${subjectId}`,
        userId: actor.userId,
        host: actor.ipAddress?.slice(0, 46),
        properties: toJsonValue(properties),
      },
    });
  }
}

function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, unknown> {
  const changes: Record<string, unknown> = {};
  for (const [field, newValue] of Object.entries(after)) {
    if (field === 'updatedAt') {
      continue;
    }
    if (JSON.stringify(before[field]) !== JSON.stringify(newValue)) {
      changes[field] = newValue;
    }
  }
  return changes;
}

/** Dates, Decimals and nested objects become plain JSON. */
function toJsonValue(value: object): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
