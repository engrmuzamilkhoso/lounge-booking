import { Injectable } from '@nestjs/common';
import type { AuditActor } from '../audit/audit-actor.js';
import { AuditService } from '../audit/audit.service.js';
import { recordNotFound } from '../common/http/not-found.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { translateUniqueName } from './lookup-errors.js';
import type { LookupResponse, SaveNationalityDto } from './lookup.dto.js';

const lookupSelect = { id: true, name: true } as const;

@Injectable()
export class NationalitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /** Alphabetical, for the nationality dropdown on the booking form. */
  findAll(): Promise<LookupResponse[]> {
    return this.prisma.nationality.findMany({
      where: { deletedAt: null },
      select: lookupSelect,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number): Promise<LookupResponse> {
    const nationality = await this.prisma.nationality.findFirst({
      where: { id, deletedAt: null },
      select: lookupSelect,
    });
    if (nationality === null) {
      throw recordNotFound();
    }
    return nationality;
  }

  async create(dto: SaveNationalityDto, actor: AuditActor): Promise<LookupResponse> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const nationality = await transaction.nationality.create({
          data: { name: dto.name },
          select: lookupSelect,
        });
        await this.auditService.recordCreated('Nationality', nationality, actor, transaction);
        return nationality;
      });
    } catch (error) {
      throw translateUniqueName(error);
    }
  }

  async update(id: number, dto: SaveNationalityDto, actor: AuditActor): Promise<LookupResponse> {
    const before = await this.findOne(id);
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const after = await transaction.nationality.update({
          where: { id },
          data: { name: dto.name },
          select: lookupSelect,
        });
        await this.auditService.recordUpdated(
          'Nationality',
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
      const nationalities = await transaction.nationality.findMany({
        where: { id: { in: ids }, deletedAt: null },
        select: lookupSelect,
      });
      await transaction.nationality.updateMany({
        where: { id: { in: nationalities.map((nationality) => nationality.id) } },
        data: { deletedAt: new Date() },
      });
      for (const nationality of nationalities) {
        await this.auditService.recordDeleted('Nationality', nationality, actor, transaction);
      }
    });
  }
}
