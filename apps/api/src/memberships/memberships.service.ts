import { HttpStatus, Injectable } from '@nestjs/common';
import { MembershipStatus, ProductCategoryId, ResponseCode } from '@booking/shared-types';
import type { AuditActor } from '../audit/audit-actor.js';
import { AuditService } from '../audit/audit.service.js';
import { formatDateOnly, parseDateOnly } from '../common/date-only.js';
import { AppException } from '../common/http/app.exception.js';
import { recordNotFound } from '../common/http/not-found.js';
import { PaginatedResult } from '../common/pagination/paginated-result.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  ApplyForMembershipDto,
  ApproveMembershipDto,
  ListMembershipsQueryDto,
  MembershipResponse,
  MembershipVerificationResponse,
  SaveMembershipDto,
} from './dto/membership.dto.js';

/** Value of `serial_no` before a membership is approved (column default). */
const UNASSIGNED_SERIAL_NO = '0';
const SERIAL_NO_LENGTH = 8;

const membershipSelect = {
  id: true,
  name: true,
  dob: true,
  contactNo: true,
  email: true,
  address: true,
  city: true,
  state: true,
  zipcode: true,
  country: true,
  membershipDeclaration: true,
  status: true,
  serialNo: true,
  visitLimit: true,
  membershipType: { select: { id: true, name: true } },
  product: { select: { id: true, name: true } },
  _count: { select: { bookings: { where: { deletedAt: null } } } },
} as const;

type MembershipRecord = Prisma.MembershipGetPayload<{ select: typeof membershipSelect }>;

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ─────────────────────────────── Customers ──────────────────────────────

  /** Website application form. Saved as pending; staff approve it in the admin panel. */
  async apply(dto: ApplyForMembershipDto, actor: AuditActor): Promise<MembershipResponse> {
    await this.assertMembershipTypeExists(dto.membershipTypeId);

    return this.prisma.$transaction(async (transaction) => {
      const created = await transaction.membership.create({
        data: {
          ...this.toDetailsData(dto),
          name: `${dto.firstName} ${dto.lastName}`,
          membershipDeclaration: '1',
          status: MembershipStatus.Pending,
        },
        select: membershipSelect,
      });
      const membership = toMembershipResponse(created);
      await this.auditService.recordCreated('Membership', membership, actor, transaction);
      return membership;
    });
  }

  /**
   * Checks a membership number before booking (Laravel `verify_membership`).
   * Memberships are corporate and not tied to a user account: anyone with the number can use
   * it until the visit limit is reached. Bookings re-check the limit when they are saved.
   */
  async verify(serialNo: string): Promise<MembershipVerificationResponse> {
    const membership = await this.prisma.membership.findFirst({
      where: { serialNo, status: MembershipStatus.Approved, deletedAt: null },
      select: { id: true, serialNo: true, visitLimit: true },
    });
    if (membership === null) {
      throw new AppException(ResponseCode.MembershipNotFound, HttpStatus.NOT_FOUND);
    }

    const usedVisits = await this.countUsedVisits(membership.id, this.prisma);
    const remainingVisits = (membership.visitLimit ?? 0) - usedVisits;
    if (remainingVisits <= 0) {
      throw new AppException(ResponseCode.MembershipLimitExceeded, HttpStatus.CONFLICT);
    }

    return { membershipId: membership.id, serialNo: membership.serialNo, remainingVisits };
  }

  /** Bookings (not deleted) made with the membership. Used by the booking service too. */
  countUsedVisits(
    membershipId: number,
    client: Pick<PrismaService, 'booking'> | Prisma.TransactionClient,
  ): Promise<number> {
    return client.booking.count({ where: { membershipId, deletedAt: null } });
  }

  // ──────────────────────────────── Admin ─────────────────────────────────

  /** Pending first, then by membership number (Laravel's admin list order). */
  async list(query: ListMembershipsQueryDto): Promise<PaginatedResult<MembershipResponse>> {
    const where: Prisma.MembershipWhereInput = { deletedAt: null, status: query.status };
    if (query.search !== undefined && query.search !== '') {
      const contains = { contains: query.search, mode: 'insensitive' as const };
      where.OR = [
        { name: contains },
        { email: contains },
        { contactNo: contains },
        { serialNo: contains },
      ];
    }

    const [memberships, total] = await this.prisma.$transaction([
      this.prisma.membership.findMany({
        where,
        select: membershipSelect,
        orderBy: [{ status: 'asc' }, { serialNo: 'asc' }, { id: 'asc' }],
        skip: query.skip,
        take: query.pageSize,
      }),
      this.prisma.membership.count({ where }),
    ]);

    return PaginatedResult.of(memberships.map(toMembershipResponse), total, query);
  }

  async findOne(id: number): Promise<MembershipResponse> {
    const membership = await this.prisma.membership.findFirst({
      where: { id, deletedAt: null },
      select: membershipSelect,
    });
    if (membership === null) {
      throw recordNotFound();
    }
    return toMembershipResponse(membership);
  }

  async create(dto: SaveMembershipDto, actor: AuditActor): Promise<MembershipResponse> {
    await this.assertMembershipTypeExists(dto.membershipTypeId);

    return this.prisma.$transaction(async (transaction) => {
      const created = await transaction.membership.create({
        data: {
          ...this.toDetailsData(dto),
          name: dto.name,
          membershipDeclaration: declarationToColumn(dto.membershipDeclaration === true),
          status: MembershipStatus.Pending,
        },
        select: membershipSelect,
      });
      const membership = toMembershipResponse(created);
      await this.auditService.recordCreated('Membership', membership, actor, transaction);
      return membership;
    });
  }

  async update(id: number, dto: SaveMembershipDto, actor: AuditActor): Promise<MembershipResponse> {
    const before = await this.findOne(id);
    await this.assertMembershipTypeExists(dto.membershipTypeId);

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.membership.update({
        where: { id },
        data: {
          ...this.toDetailsData(dto),
          name: dto.name,
          membershipDeclaration:
            dto.membershipDeclaration === undefined
              ? undefined
              : declarationToColumn(dto.membershipDeclaration),
        },
        select: membershipSelect,
      });
      const after = toMembershipResponse(updated);
      await this.auditService.recordUpdated(
        'Membership',
        { ...before },
        { ...after },
        actor,
        transaction,
      );
      return after;
    });
  }

  /**
   * Suggested number for the next approval: highest existing membership number + 1,
   * zero-padded to 8 digits (Laravel `getApproveMembershipForm`). Deleted memberships are
   * included so a number is never handed out twice.
   */
  async getNextSerialNo(): Promise<{ serialNo: string }> {
    const rows = await this.prisma.$queryRaw<{ highest: bigint | null }[]>`
      SELECT MAX(CAST(serial_no AS BIGINT)) AS highest
      FROM memberships
      WHERE serial_no ~ '^[0-9]+$'`;
    const highest = rows[0]?.highest ?? 0n;
    const next = (highest + 1n).toString().padStart(SERIAL_NO_LENGTH, '0');
    return { serialNo: next };
  }

  /** Approves a membership: assigns its number, product and visit limit. */
  async approve(
    id: number,
    dto: ApproveMembershipDto,
    actor: AuditActor,
  ): Promise<MembershipResponse> {
    const before = await this.findOne(id);
    await this.assertMembershipProduct(dto.productId);
    await this.assertSerialNoAvailable(dto.serialNo, id);

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.membership.update({
        where: { id },
        data: {
          status: MembershipStatus.Approved,
          serialNo: dto.serialNo,
          productId: dto.productId,
          visitLimit: dto.visitLimit,
        },
        select: membershipSelect,
      });
      const after = toMembershipResponse(updated);
      await this.auditService.recordUpdated(
        'Membership',
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
      const memberships = await transaction.membership.findMany({
        where: { id: { in: ids }, deletedAt: null },
        select: membershipSelect,
      });
      await transaction.membership.updateMany({
        where: { id: { in: memberships.map((membership) => membership.id) } },
        data: { deletedAt: new Date() },
      });
      for (const membership of memberships) {
        await this.auditService.recordDeleted(
          'Membership',
          toMembershipResponse(membership),
          actor,
          transaction,
        );
      }
    });
  }

  // ─────────────────────────────── Helpers ────────────────────────────────

  private toDetailsData(dto: ApplyForMembershipDto | SaveMembershipDto): {
    membershipTypeId: number;
    dob: Date;
    contactNo: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipcode: string;
    country: string;
  } {
    return {
      membershipTypeId: dto.membershipTypeId,
      dob: parseDateOnly(dto.dob),
      contactNo: dto.contactNo,
      email: dto.email,
      address: dto.address,
      city: dto.city,
      state: dto.state,
      zipcode: dto.zipcode,
      country: dto.country,
    };
  }

  private async assertMembershipTypeExists(membershipTypeId: number): Promise<void> {
    const membershipType = await this.prisma.membershipType.findFirst({
      where: { id: membershipTypeId, deletedAt: null },
      select: { id: true },
    });
    if (membershipType === null) {
      throw invalidField('membershipTypeId', 'The selected membership type does not exist');
    }
  }

  private async assertMembershipProduct(productId: number): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        categoryId: ProductCategoryId.InternationalDomestic,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (product === null) {
      throw invalidField('productId', 'The selected product is not a membership product');
    }
  }

  /** Two approved memberships with the same number would make verification ambiguous. */
  private async assertSerialNoAvailable(
    serialNo: string,
    exceptMembershipId: number,
  ): Promise<void> {
    const existing = await this.prisma.membership.findFirst({
      where: {
        serialNo,
        status: MembershipStatus.Approved,
        deletedAt: null,
        id: { not: exceptMembershipId },
      },
      select: { id: true },
    });
    if (existing !== null) {
      throw invalidField('serialNo', 'This membership number is already in use');
    }
  }
}

function invalidField(field: string, message: string): AppException {
  return new AppException(ResponseCode.InvalidData, HttpStatus.UNPROCESSABLE_ENTITY, {
    [field]: [message],
  });
}

function declarationToColumn(accepted: boolean): string {
  if (accepted) {
    return '1';
  }
  return '0';
}

function toMembershipResponse(membership: MembershipRecord): MembershipResponse {
  const hasSerialNo = membership.serialNo !== UNASSIGNED_SERIAL_NO;
  return {
    id: membership.id,
    membershipType: membership.membershipType,
    name: membership.name,
    dob: formatDateOnly(membership.dob),
    contactNo: membership.contactNo,
    email: membership.email,
    address: membership.address,
    city: membership.city,
    state: membership.state,
    zipcode: membership.zipcode,
    country: membership.country,
    membershipDeclaration: membership.membershipDeclaration === '1',
    // The database CHECK constraint limits status to 1 or 2.
    status: membership.status as MembershipStatus,
    serialNo: hasSerialNo ? membership.serialNo : null,
    product: membership.product,
    visitLimit: membership.visitLimit,
    usedVisits: membership._count.bookings,
  };
}
