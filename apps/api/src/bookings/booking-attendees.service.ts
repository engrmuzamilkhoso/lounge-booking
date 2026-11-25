import { Injectable } from '@nestjs/common';
import { AttendeeType } from '@booking/shared-types';
import type { AuditActor } from '../audit/audit-actor.js';
import { AuditService } from '../audit/audit.service.js';
import { parseDateOnly } from '../common/date-only.js';
import { recordNotFound } from '../common/http/not-found.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { type AttendeeResponse, attendeeSelect, toAttendeeResponse } from './booking-response.js';
import type { AttendeeDto, UpdateAttendeeDto } from './dto/attendee.dto.js';

/** Which booking quantity column counts each passenger type. */
const QUANTITY_FIELD_BY_TYPE = {
  [AttendeeType.Adult]: 'adultQty',
  [AttendeeType.Child]: 'childQty',
  [AttendeeType.Infant]: 'infantQty',
} as const;

/**
 * Staff management of a booking's passengers (Laravel "booking details" admin screens).
 * Adding or removing a passenger keeps the booking's passenger counts in step; the booking's
 * total amount is not recalculated (staff adjust bookings after the price was agreed).
 */
@Injectable()
export class BookingAttendeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async add(bookingId: number, dto: AttendeeDto, actor: AuditActor): Promise<AttendeeResponse> {
    await this.assertBookingExists(bookingId);

    return this.prisma.$transaction(async (transaction) => {
      const created = await transaction.bookingAttendee.create({
        data: {
          bookingId,
          attendeeType: dto.type,
          name: dto.name,
          dob: parseDateOnly(dto.dob),
          nationality: dto.nationality,
          address: dto.address,
          passportCnic: dto.passportCnic,
          passportCnicExpiry: dto.passportCnicExpiry,
          contactNo: dto.contactNo,
          email: dto.email,
          guardianContact: dto.guardianContact,
        },
        select: attendeeSelect,
      });
      await this.changePassengerCount(bookingId, dto.type, 1, transaction);

      const attendee = toAttendeeResponse(created);
      await this.auditService.recordCreated('BookingDetail', attendee, actor, transaction);
      return attendee;
    });
  }

  async update(
    bookingId: number,
    attendeeId: number,
    dto: UpdateAttendeeDto,
    actor: AuditActor,
  ): Promise<AttendeeResponse> {
    const before = await this.findOne(bookingId, attendeeId);

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.bookingAttendee.update({
        where: { id: attendeeId },
        data: {
          name: dto.name,
          dob: dto.dob === undefined ? undefined : parseDateOnly(dto.dob),
          nationality: dto.nationality,
          address: dto.address,
          passportCnic: dto.passportCnic,
          passportCnicExpiry: dto.passportCnicExpiry,
          contactNo: dto.contactNo,
          email: dto.email,
          guardianContact: dto.guardianContact,
        },
        select: attendeeSelect,
      });
      const after = toAttendeeResponse(updated);
      await this.auditService.recordUpdated(
        'BookingDetail',
        { ...before },
        { ...after },
        actor,
        transaction,
      );
      return after;
    });
  }

  async remove(bookingId: number, attendeeId: number, actor: AuditActor): Promise<void> {
    const attendee = await this.findOne(bookingId, attendeeId);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.bookingAttendee.update({
        where: { id: attendeeId },
        data: { deletedAt: new Date() },
      });
      await this.changePassengerCount(bookingId, attendee.type, -1, transaction);
      await this.auditService.recordDeleted('BookingDetail', attendee, actor, transaction);
    });
  }

  private async findOne(bookingId: number, attendeeId: number): Promise<AttendeeResponse> {
    const attendee = await this.prisma.bookingAttendee.findFirst({
      where: { id: attendeeId, bookingId, deletedAt: null, booking: { deletedAt: null } },
      select: attendeeSelect,
    });
    if (attendee === null) {
      throw recordNotFound();
    }
    return toAttendeeResponse(attendee);
  }

  private async assertBookingExists(bookingId: number): Promise<void> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      select: { id: true },
    });
    if (booking === null) {
      throw recordNotFound();
    }
  }

  private async changePassengerCount(
    bookingId: number,
    type: AttendeeType,
    change: 1 | -1,
    transaction: Prisma.TransactionClient,
  ): Promise<void> {
    const quantityField = QUANTITY_FIELD_BY_TYPE[type];
    const booking = await transaction.booking.findUniqueOrThrow({
      where: { id: bookingId },
      select: { adultQty: true, childQty: true, infantQty: true },
    });
    // Imported Laravel bookings can have NULL counts; NULL + 1 would stay NULL in SQL.
    const currentCount = booking[quantityField] ?? 0;
    await transaction.booking.update({
      where: { id: bookingId },
      data: { [quantityField]: Math.max(0, currentCount + change) },
    });
  }
}
