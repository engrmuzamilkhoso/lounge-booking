import { Injectable } from '@nestjs/common';
import type { AuditActor } from '../../audit/audit-actor.js';
import { AuditService } from '../../audit/audit.service.js';
import { recordNotFound } from '../../common/http/not-found.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CardResponse, SaveCardDto } from './card.dto.js';

const cardSelect = {
  id: true,
  name: true,
  detail: true,
  bin: true,
  sortOrder: true,
  isActive: true,
} as const;

@Injectable()
export class CardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * All cards that are not deleted, including inactive ones, in id order: Laravel's booking
   * form listed `Card::all()` the same way. `isActive` is returned so clients can decide.
   */
  findAll(): Promise<CardResponse[]> {
    return this.prisma.card.findMany({
      where: { deletedAt: null },
      select: cardSelect,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number): Promise<CardResponse> {
    const card = await this.prisma.card.findFirst({
      where: { id, deletedAt: null },
      select: cardSelect,
    });
    if (card === null) {
      throw recordNotFound();
    }
    return card;
  }

  create(dto: SaveCardDto, actor: AuditActor): Promise<CardResponse> {
    return this.prisma.$transaction(async (transaction) => {
      const card = await transaction.card.create({
        data: {
          name: dto.name,
          detail: dto.detail,
          bin: dto.bin,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        },
        select: cardSelect,
      });
      await this.auditService.recordCreated('Card', card, actor, transaction);
      return card;
    });
  }

  async update(id: number, dto: SaveCardDto, actor: AuditActor): Promise<CardResponse> {
    const before = await this.findOne(id);
    return this.prisma.$transaction(async (transaction) => {
      const after = await transaction.card.update({
        where: { id },
        data: {
          name: dto.name,
          detail: dto.detail,
          bin: dto.bin,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        },
        select: cardSelect,
      });
      await this.auditService.recordUpdated(
        'Card',
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
      const cards = await transaction.card.findMany({
        where: { id: { in: ids }, deletedAt: null },
        select: cardSelect,
      });
      await transaction.card.updateMany({
        where: { id: { in: cards.map((card) => card.id) } },
        data: { deletedAt: new Date() },
      });
      for (const card of cards) {
        await this.auditService.recordDeleted('Card', card, actor, transaction);
      }
    });
  }
}
