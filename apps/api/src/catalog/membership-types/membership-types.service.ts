import { Injectable } from '@nestjs/common';
import type { AuditActor } from '../../audit/audit-actor.js';
import { AuditService } from '../../audit/audit.service.js';
import { recordNotFound } from '../../common/http/not-found.js';
import { decimalToNumber } from '../../common/money.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { MembershipTypeResponse, SaveMembershipTypeDto } from './membership-type.dto.js';

const membershipTypeSelect = {
  id: true,
  name: true,
  price1: true,
  price1Text: true,
  price2: true,
  price2Text: true,
} as const;

type MembershipTypeRecord = Prisma.MembershipTypeGetPayload<{
  select: typeof membershipTypeSelect;
}>;

@Injectable()
export class MembershipTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(): Promise<MembershipTypeResponse[]> {
    const membershipTypes = await this.prisma.membershipType.findMany({
      where: { deletedAt: null },
      select: membershipTypeSelect,
      orderBy: { id: 'asc' },
    });
    return membershipTypes.map(toMembershipTypeResponse);
  }

  async findOne(id: number): Promise<MembershipTypeResponse> {
    const membershipType = await this.prisma.membershipType.findFirst({
      where: { id, deletedAt: null },
      select: membershipTypeSelect,
    });
    if (membershipType === null) {
      throw recordNotFound();
    }
    return toMembershipTypeResponse(membershipType);
  }

  create(dto: SaveMembershipTypeDto, actor: AuditActor): Promise<MembershipTypeResponse> {
    return this.prisma.$transaction(async (transaction) => {
      const created = await transaction.membershipType.create({
        data: toMembershipTypeData(dto),
        select: membershipTypeSelect,
      });
      const response = toMembershipTypeResponse(created);
      await this.auditService.recordCreated('MembershipType', response, actor, transaction);
      return response;
    });
  }

  async update(
    id: number,
    dto: SaveMembershipTypeDto,
    actor: AuditActor,
  ): Promise<MembershipTypeResponse> {
    const before = await this.findOne(id);
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.membershipType.update({
        where: { id },
        data: toMembershipTypeData(dto),
        select: membershipTypeSelect,
      });
      const after = toMembershipTypeResponse(updated);
      await this.auditService.recordUpdated(
        'MembershipType',
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
      const membershipTypes = await transaction.membershipType.findMany({
        where: { id: { in: ids }, deletedAt: null },
        select: membershipTypeSelect,
      });
      await transaction.membershipType.updateMany({
        where: { id: { in: membershipTypes.map((membershipType) => membershipType.id) } },
        data: { deletedAt: new Date() },
      });
      for (const membershipType of membershipTypes) {
        await this.auditService.recordDeleted(
          'MembershipType',
          toMembershipTypeResponse(membershipType),
          actor,
          transaction,
        );
      }
    });
  }
}

function toMembershipTypeData(dto: SaveMembershipTypeDto): Prisma.MembershipTypeCreateInput {
  return {
    name: dto.name,
    price1: dto.price1,
    price1Text: dto.price1Text,
    price2: dto.price2,
    price2Text: dto.price2Text,
  };
}

function toMembershipTypeResponse(membershipType: MembershipTypeRecord): MembershipTypeResponse {
  return {
    id: membershipType.id,
    name: membershipType.name,
    price1: decimalToNumber(membershipType.price1),
    price1Text: membershipType.price1Text,
    price2: decimalToNumber(membershipType.price2),
    price2Text: membershipType.price2Text,
  };
}
