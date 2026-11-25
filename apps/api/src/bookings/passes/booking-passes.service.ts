import { HttpStatus, Injectable } from '@nestjs/common';
import { PassStatus, ResponseCode } from '@booking/shared-types';
import type { AuditActor } from '../../audit/audit-actor.js';
import { AuditService } from '../../audit/audit.service.js';
import { formatDateOnly, todayInPakistan } from '../../common/date-only.js';
import { AppException } from '../../common/http/app.exception.js';
import { recordNotFound } from '../../common/http/not-found.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { bookingSelect, toBookingResponse } from '../booking-response.js';
import { passStatusFor } from './pass-status.js';
import type { PassVerificationResponse } from './pass-verification.js';

/** Pass tokens are 64 lowercase hex characters (see the add_booking_passes migration). */
const PASS_TOKEN_PATTERN = /^[0-9a-f]{64}$/;

const passSelect = {
  ...bookingSelect,
  checkedInBy: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.BookingSelect;

type PassRecord = Prisma.BookingGetPayload<{ select: typeof passSelect }>;

/**
 * Lounge passes at the counter: staff scan the customer's QR code (or type the booking
 * reference), see whether the booking may be used, and check it in. A pass can be checked in
 * once; the check-in is recorded in the audit log.
 */
@Injectable()
export class BookingPassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async verifyByToken(token: string): Promise<PassVerificationResponse> {
    const booking = await this.findByToken(token);
    return toVerification(booking);
  }

  /** Includes deleted bookings, so staff are told the booking was cancelled. */
  async verifyByCode(code: string): Promise<PassVerificationResponse> {
    const booking = await this.prisma.booking.findUnique({ where: { code }, select: passSelect });
    if (booking === null) {
      throw recordNotFound();
    }
    return toVerification(booking);
  }

  async checkIn(token: string, actor: AuditActor): Promise<PassVerificationResponse> {
    const booking = await this.findByToken(token);
    const status = passStatusFor(booking, todayInPakistan());
    if (status === PassStatus.AlreadyUsed) {
      throw new AppException(ResponseCode.PassAlreadyUsed, HttpStatus.CONFLICT);
    }
    if (status !== PassStatus.Valid) {
      throw new AppException(ResponseCode.PassNotValid, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const checkedInAt = new Date();
    await this.prisma.$transaction(async (transaction) => {
      // The `checkedInAt: null` condition keeps the check-in single-use even when two staff
      // members scan the same pass at the same moment: only one update can match.
      const result = await transaction.booking.updateMany({
        where: { id: booking.id, checkedInAt: null },
        data: { checkedInAt, checkedInById: actor.userId },
      });
      if (result.count === 0) {
        throw new AppException(ResponseCode.PassAlreadyUsed, HttpStatus.CONFLICT);
      }
      await this.auditService.recordUpdated(
        'Booking',
        { id: booking.id, checkedInAt: null, checkedInById: null },
        { id: booking.id, checkedInAt: checkedInAt.toISOString(), checkedInById: actor.userId },
        actor,
        transaction,
      );
    });

    return this.verifyByToken(token);
  }

  private async findByToken(token: string): Promise<PassRecord> {
    if (!PASS_TOKEN_PATTERN.test(token)) {
      throw recordNotFound();
    }
    const booking = await this.prisma.booking.findUnique({
      where: { passToken: token },
      select: passSelect,
    });
    if (booking === null) {
      throw recordNotFound();
    }
    return booking;
  }
}

function toVerification(booking: PassRecord): PassVerificationResponse {
  const today = todayInPakistan();
  return {
    status: passStatusFor(booking, today),
    departsToday: formatDateOnly(booking.departureDate) === today,
    checkedInAt: booking.checkedInAt === null ? null : booking.checkedInAt.toISOString(),
    checkedInBy: booking.checkedInBy === null ? null : staffMember(booking.checkedInBy),
    booking: toBookingResponse(booking),
  };
}

function staffMember(user: {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
}): { id: number; name: string } {
  const fullName = [user.firstName, user.lastName]
    .filter((part) => part !== null && part !== '')
    .join(' ');
  return { id: user.id, name: fullName === '' ? user.email : fullName };
}
