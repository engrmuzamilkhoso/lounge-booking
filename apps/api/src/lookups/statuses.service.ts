import { Injectable } from '@nestjs/common';
import type { AuditActor } from '../audit/audit-actor.js';
import { AuditService } from '../audit/audit.service.js';
import { recordNotFound } from '../common/http/not-found.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { translateUniqueName } from './lookup-errors.js';
import type { LookupResponse, SaveStatusDto } from './lookup.dto.js';

const lookupSelect = { id: true, name: true } as const;

/**
 * Booking statuses ("In Process", "Completed", "Cancelled", …). Staff maintain this list,
 * but bookings do not have a status column, the same as in Laravel.
 */
@Injectable()
export class StatusesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAll(): Promise<LookupResponse[]> {
    return this.prisma.status.findMany({
      where: { deletedAt: null },
      select: lookupSelect,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number): Promise<LookupResponse> {
    const status = await this.prisma.status.findFirst({
      where: { id, deletedAt: null },
      select: lookupSelect,
    });
    if (status === null) {
      throw recordNotFound();
    }
    return status;
  }

  async create(dto: SaveStatusDto, actor: AuditActor): Promise<LookupResponse> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const status = await transaction.status.create({
          data: { name: dto.name },
          select: lookupSelect,
        });
        await this.auditService.recordCreated('Status', status, actor, transaction);
        return status;
      });
    } catch (error) {
      throw translateUniqueName(error);
    }
  }

  async update(id: number, dto: SaveStatusDto, actor: AuditActor): Promise<LookupResponse> {
    const before = await this.findOne(id);
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const after = await transaction.status.update({
          where: { id },
          data: { name: dto.name },
          select: lookupSelect,
        });
        await this.auditService.recordUpdated(
          'Status',
          { ...before },
          { ...after },
          actor,
          transaction,
        );
        return after;
      });
    } catch (error) {
      throw translateUniqueName(error);
    }
  }

  async softDelete(ids: number[], actor: AuditActor): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const statuses = await transaction.status.findMany({
        where: { id: { in: ids }, deletedAt: null },
        select: lookupSelect,
      });
      await transaction.status.updateMany({
        where: { id: { in: statuses.map((status) => status.id) } },
        data: { deletedAt: new Date() },
      });
      for (const status of statuses) {
        await this.auditService.recordDeleted('Status', status, actor, transaction);
      }
    });
  }
}
