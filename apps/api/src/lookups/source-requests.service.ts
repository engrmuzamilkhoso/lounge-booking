import { Injectable } from '@nestjs/common';
import type { AuditActor } from '../audit/audit-actor.js';
import { AuditService } from '../audit/audit.service.js';
import { recordNotFound } from '../common/http/not-found.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LookupResponse, SaveSourceRequestDto } from './lookup.dto.js';

const lookupSelect = { id: true, name: true } as const;

/** Where bookings come from: 1 Web, 2 App (ids used by the booking service). */
@Injectable()
export class SourceRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAll(): Promise<LookupResponse[]> {
    return this.prisma.sourceRequest.findMany({
      where: { deletedAt: null },
      select: lookupSelect,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number): Promise<LookupResponse> {
    const sourceRequest = await this.prisma.sourceRequest.findFirst({
      where: { id, deletedAt: null },
      select: lookupSelect,
    });
    if (sourceRequest === null) {
      throw recordNotFound();
    }
    return sourceRequest;
  }

  create(dto: SaveSourceRequestDto, actor: AuditActor): Promise<LookupResponse> {
    return this.prisma.$transaction(async (transaction) => {
      const sourceRequest = await transaction.sourceRequest.create({
        data: { name: dto.name },
        select: lookupSelect,
      });
      await this.auditService.recordCreated('SourceRequest', sourceRequest, actor, transaction);
      return sourceRequest;
    });
  }

  async update(id: number, dto: SaveSourceRequestDto, actor: AuditActor): Promise<LookupResponse> {
    const before = await this.findOne(id);
    return this.prisma.$transaction(async (transaction) => {
      const after = await transaction.sourceRequest.update({
        where: { id },
        data: { name: dto.name },
        select: lookupSelect,
      });
      await this.auditService.recordUpdated(
        'SourceRequest',
        { ...before },
        { ...after },
        actor,
        transaction,
      );
      return after;
    });
  }

  async softDelete(ids: number[], actor: AuditActor): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const sourceRequests = await transaction.sourceRequest.findMany({
        where: { id: { in: ids }, deletedAt: null },
        select: lookupSelect,
      });
      await transaction.sourceRequest.updateMany({
        where: { id: { in: sourceRequests.map((sourceRequest) => sourceRequest.id) } },
        data: { deletedAt: new Date() },
      });
      for (const sourceRequest of sourceRequests) {
        await this.auditService.recordDeleted('SourceRequest', sourceRequest, actor, transaction);
      }
    });
  }
}
