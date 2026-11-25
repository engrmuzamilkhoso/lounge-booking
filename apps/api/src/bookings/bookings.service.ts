import { HttpStatus, Injectable } from '@nestjs/common';
import { ResponseCode } from '@booking/shared-types';
import type { AuditActor } from '../audit/audit-actor.js';
import { AuditService } from '../audit/audit.service.js';
import { parseDateOnly } from '../common/date-only.js';
import { AppException } from '../common/http/app.exception.js';
import { recordNotFound } from '../common/http/not-found.js';
import type { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { PaginatedResult } from '../common/pagination/paginated-result.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  type BookingResponse,
  bookingSelect,
  parseTimeOfDay,
  toBookingResponse,
} from './booking-response.js';
import type { ListBookingsQueryDto, UpdateBookingDto } from './dto/booking.dto.js';

/** Newest first, as customers and staff look for recent bookings. */
const NEWEST_FIRST: Prisma.BookingOrderByWithRelationInput[] = [{ id: 'desc' }];

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ─────────────────────────────── Customers ──────────────────────────────

  /** "My bookings": only the caller's own bookings (Laravel `mybookings`). */
  listForCustomer(
    customerId: number,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<BookingResponse>> {
    return this.findPage({ customerId, deletedAt: null }, query);
  }

  /** A booking that belongs to someone else answers 404, not 403, to avoid revealing it exists. */
  async findForCustomer(customerId: number, bookingId: number): Promise<BookingResponse> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, customerId, deletedAt: null },
      select: bookingSelect,
    });
    if (booking === null) {
      throw recordNotFound();
    }
    return toBookingResponse(booking);
  }

  // ──────────────────────────────── Admin ─────────────────────────────────

  listForAdmin(query: ListBookingsQueryDto): Promise<PaginatedResult<BookingResponse>> {
    const where: Prisma.BookingWhereInput = { deletedAt: null, serviceId: query.serviceId };

    if (query.search !== undefined && query.search !== '') {
      const contains = { contains: query.search, mode: 'insensitive' as const };
      where.OR = [
        { code: contains },
        { flightNumber: contains },
        { customer: { firstName: contains } },
        { customer: { lastName: contains } },
        { customer: { email: contains } },
      ];
    }

    const departureRange: Prisma.DateTimeFilter = {};
    if (query.departureFrom !== undefined) {
      departureRange.gte = parseDateOnly(query.departureFrom);
    }
    if (query.departureTo !== undefined) {
      departureRange.lte = parseDateOnly(query.departureTo);
    }
    if (Object.keys(departureRange).length > 0) {
      where.departureDate = departureRange;
    }

    return this.findPage(where, query);
  }

  async findForAdmin(bookingId: number): Promise<BookingResponse> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      select: bookingSelect,
    });
    if (booking === null) {
      throw recordNotFound();
    }
    return toBookingResponse(booking);
  }

  async update(
    bookingId: number,
    dto: UpdateBookingDto,
    actor: AuditActor,
  ): Promise<BookingResponse> {
    const before = await this.findForAdmin(bookingId);
    if (dto.bankCardId !== undefined) {
      await this.assertBankCardExists(dto.bankCardId);
    }

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.booking.update({
        where: { id: bookingId },
        data: {
          flightNumber: dto.flightNumber,
          flightDetail: dto.flightDetail,
          departureDate:
            dto.departureDate === undefined ? undefined : parseDateOnly(dto.departureDate),
          departureTime:
            dto.departureTime === undefined ? undefined : parseTimeOfDay(dto.departureTime),
          bankCardId: dto.bankCardId,
        },
        select: bookingSelect,
      });
      const after = toBookingResponse(updated);
      await this.auditService.recordUpdated(
        'Booking',
        withoutAttendees(before),
        withoutAttendees(after),
        actor,
        transaction,
      );
      return after;
    });
  }

  async softDelete(bookingIds: number[], actor: AuditActor): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const bookings = await transaction.booking.findMany({
        where: { id: { in: bookingIds }, deletedAt: null },
        select: bookingSelect,
      });
      await transaction.booking.updateMany({
        where: { id: { in: bookings.map((booking) => booking.id) } },
        data: { deletedAt: new Date() },
      });
      for (const booking of bookings) {
        await this.auditService.recordDeleted(
          'Booking',
          withoutAttendees(toBookingResponse(booking)),
          actor,
          transaction,
        );
      }
    });
  }

  // ─────────────────────────────── Helpers ────────────────────────────────

  private async findPage(
    where: Prisma.BookingWhereInput,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<BookingResponse>> {
    const [bookings, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        select: bookingSelect,
        orderBy: NEWEST_FIRST,
        skip: query.skip,
        take: query.pageSize,
      }),
      this.prisma.booking.count({ where }),
    ]);
    return PaginatedResult.of(bookings.map(toBookingResponse), total, query);
  }

  private async assertBankCardExists(bankCardId: number): Promise<void> {
    const card = await this.prisma.card.findFirst({
      where: { id: bankCardId, deletedAt: null },
      select: { id: true },
    });
    if (card === null) {
      throw new AppException(ResponseCode.InvalidData, HttpStatus.UNPROCESSABLE_ENTITY, {
        bankCardId: ['The selected bank card does not exist'],
      });
    }
  }
}

/** Audit entries for a booking hold the booking fields; passengers are audited separately. */
function withoutAttendees(booking: BookingResponse): Omit<BookingResponse, 'attendees'> {
  const { attendees, ...bookingFields } = booking;
  return bookingFields;
}
