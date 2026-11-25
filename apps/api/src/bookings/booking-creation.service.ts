import { HttpStatus, Injectable } from '@nestjs/common';
import {
  BookingPaymentStatus,
  MembershipStatus,
  ResponseCode,
  type SourceRequestId,
} from '@booking/shared-types';
import type { AuditActor } from '../audit/audit-actor.js';
import { AuditService } from '../audit/audit.service.js';
import { calculateBookingTotal, type ProductPrices } from '../catalog/products/product-pricing.js';
import { parseDateOnly, todayInPakistan } from '../common/date-only.js';
import { AppException } from '../common/http/app.exception.js';
import type { Prisma } from '../generated/prisma/client.js';
import { MembershipsService } from '../memberships/memberships.service.js';
import { isUniqueConstraintViolation } from '../prisma/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { formatBookingCode } from './booking-code.js';
import { BookingConfirmationMailer } from './booking-confirmation.mailer.js';
import {
  type BookingResponse,
  bookingSelect,
  parseTimeOfDay,
  toAttendeeResponse,
  toBookingResponse,
} from './booking-response.js';
import { type BookedProduct, findBookingRuleViolations } from './booking-rules.js';
import type { AttendeeDto } from './dto/attendee.dto.js';
import type { BookingDetailsDto } from './dto/booking.dto.js';

export interface CreateBookingCommand {
  details: BookingDetailsDto;
  customerId: number;
  sourceRequestId: SourceRequestId;
  /** Total the customer saw; the booking is rejected if the server's price differs. */
  expectedTotalAmount?: number;
  /** Retrying a request with the same key returns the first booking instead of a duplicate. */
  idempotencyKey?: string;
  /** Customers cannot book flights that already left; staff may record past bookings. */
  rejectPastDepartures: boolean;
  /**
   * Laravel emailed web bookings only, not bookings entered by staff. Bookings that must be
   * paid are emailed once payment is confirmed instead (see PaymentsService).
   */
  sendConfirmationEmail: boolean;
  actor: AuditActor;
}

interface PricedProduct extends BookedProduct {
  id: number;
  categoryId: number;
  prices: ProductPrices;
}

@Injectable()
export class BookingCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly membershipsService: MembershipsService,
    private readonly bookingConfirmationMailer: BookingConfirmationMailer,
  ) {}

  async create(command: CreateBookingCommand): Promise<BookingResponse> {
    if (command.idempotencyKey !== undefined) {
      const previous = await this.findByIdempotencyKey(command.customerId, command.idempotencyKey);
      if (previous !== null) {
        return previous;
      }
    }

    const { details } = command;
    if (command.rejectPastDepartures && details.departureDate < todayInPakistan()) {
      throw invalidField('departureDate', 'The departure date has already passed');
    }

    const product = await this.loadProduct(details.productId);
    const ruleViolations = findBookingRuleViolations(details, product);
    if (Object.keys(ruleViolations).length > 0) {
      throw new AppException(
        ResponseCode.InvalidData,
        HttpStatus.UNPROCESSABLE_ENTITY,
        ruleViolations,
      );
    }
    if (details.bankCardId !== undefined) {
      await this.assertBankCardIsActive(details.bankCardId);
    }

    const totalAmount = this.calculateTotal(product, details);
    if (command.expectedTotalAmount !== undefined && command.expectedTotalAmount !== totalAmount) {
      throw new AppException(ResponseCode.PriceMismatch, HttpStatus.CONFLICT, {
        expectedTotalAmount: [`The current price is ${totalAmount}`],
      });
    }

    let booking: BookingResponse;
    try {
      booking = await this.saveBooking(command, product, totalAmount);
    } catch (error) {
      // Two identical requests raced: the other one saved first, so return its booking.
      const idempotencyKey = command.idempotencyKey;
      if (idempotencyKey === undefined || !isUniqueConstraintViolation(error)) {
        throw error;
      }
      const previous = await this.findByIdempotencyKey(command.customerId, idempotencyKey);
      if (previous === null) {
        throw error;
      }
      return previous;
    }

    const isFree = booking.paymentStatus === BookingPaymentStatus.NotRequired;
    if (command.sendConfirmationEmail && isFree) {
      await this.bookingConfirmationMailer.send(booking.id);
    }
    return booking;
  }

  private saveBooking(
    command: CreateBookingCommand,
    product: PricedProduct,
    totalAmount: number,
  ): Promise<BookingResponse> {
    const { details } = command;

    return this.prisma.$transaction(async (transaction) => {
      if (details.membershipId !== undefined) {
        await this.reserveMembershipVisit(details.membershipId, transaction);
      }

      const bookingId = await this.reserveBookingId(transaction);
      const created = await transaction.booking.create({
        data: {
          id: bookingId,
          code: formatBookingCode(bookingId),
          serviceId: product.serviceId,
          categoryId: product.categoryId,
          productId: product.id,
          customerId: command.customerId,
          sourceRequestId: command.sourceRequestId,
          membershipId: details.membershipId,
          bankCardId: details.bankCardId,
          flightNumber: details.flightNumber,
          departureDate: parseDateOnly(details.departureDate),
          departureTime: parseTimeOfDay(details.departureTime),
          adultQty: details.adults,
          childQty: details.children,
          infantQty: details.infants,
          guestQty: details.guests ?? 0,
          totalAmount,
          // Free bookings (bank-card lounge, membership visits) are confirmed straight away;
          // anything with a price waits for payment.
          paymentStatus:
            totalAmount > 0 ? BookingPaymentStatus.Pending : BookingPaymentStatus.NotRequired,
          idempotencyKey: command.idempotencyKey,
          attendees: { create: details.attendees.map(toAttendeeData) },
        },
        select: bookingSelect,
      });

      const booking = toBookingResponse(created);
      const { attendees, ...bookingWithoutAttendees } = booking;
      await this.auditService.recordCreated(
        'Booking',
        bookingWithoutAttendees,
        command.actor,
        transaction,
      );
      for (const attendee of created.attendees) {
        await this.auditService.recordCreated(
          'BookingDetail',
          toAttendeeResponse(attendee),
          command.actor,
          transaction,
        );
      }
      return { ...bookingWithoutAttendees, attendees };
    });
  }

  /**
   * Locks the membership row until the transaction ends, so concurrent bookings with the same
   * membership are counted one after another and cannot exceed the visit limit together.
   */
  private async reserveMembershipVisit(
    membershipId: number,
    transaction: Prisma.TransactionClient,
  ): Promise<void> {
    const rows = await transaction.$queryRaw<{ visit_limit: number | null }[]>`
      SELECT visit_limit
      FROM memberships
      WHERE id = ${membershipId} AND status = ${MembershipStatus.Approved} AND deleted_at IS NULL
      FOR UPDATE`;
    const membership = rows[0];
    if (membership === undefined) {
      throw new AppException(ResponseCode.MembershipNotFound, HttpStatus.NOT_FOUND);
    }

    const usedVisits = await this.membershipsService.countUsedVisits(membershipId, transaction);
    if (usedVisits >= (membership.visit_limit ?? 0)) {
      throw new AppException(ResponseCode.MembershipLimitExceeded, HttpStatus.CONFLICT);
    }
  }

  private async reserveBookingId(transaction: Prisma.TransactionClient): Promise<number> {
    const rows = await transaction.$queryRaw<{ id: number }[]>`
      SELECT nextval(pg_get_serial_sequence('bookings', 'id'))::int AS id`;
    const reserved = rows[0];
    if (reserved === undefined) {
      throw new Error('Could not reserve a booking id');
    }
    return reserved.id;
  }

  private async loadProduct(productId: number): Promise<PricedProduct> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null, service: { deletedAt: null } },
      select: {
        id: true,
        serviceId: true,
        categoryId: true,
        price: true,
        childPrice: true,
        childLimit: true,
        infantPrice: true,
        infantLimit: true,
        guestPrice: true,
      },
    });
    if (product === null) {
      throw invalidField('productId', 'The selected product does not exist');
    }

    return {
      id: product.id,
      serviceId: product.serviceId,
      categoryId: product.categoryId,
      guestPrice: product.guestPrice,
      prices: {
        adultPrice: product.price === null ? 0 : product.price.toNumber(),
        childPrice: product.childPrice,
        childLimit: product.childLimit,
        infantPrice: product.infantPrice,
        infantLimit: product.infantLimit,
        guestPrice: product.guestPrice ?? 0,
      },
    };
  }

  /** `total_amount` is a whole-rupee integer column, as in Laravel. */
  private calculateTotal(product: PricedProduct, details: BookingDetailsDto): number {
    const total = calculateBookingTotal(product.prices, {
      adults: details.adults,
      children: details.children,
      infants: details.infants,
      guests: details.guests ?? 0,
    });
    return Math.round(total);
  }

  /** New bookings can only use cards offered on the booking form (active, not deleted). */
  private async assertBankCardIsActive(bankCardId: number): Promise<void> {
    const card = await this.prisma.card.findFirst({
      where: { id: bankCardId, deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (card === null) {
      throw invalidField('bankCardId', 'The selected bank card is not available');
    }
  }

  private async findByIdempotencyKey(
    customerId: number,
    idempotencyKey: string,
  ): Promise<BookingResponse | null> {
    const booking = await this.prisma.booking.findFirst({
      where: { customerId, idempotencyKey },
      select: bookingSelect,
    });
    if (booking === null) {
      return null;
    }
    return toBookingResponse(booking);
  }
}

function toAttendeeData(attendee: AttendeeDto): Prisma.BookingAttendeeCreateWithoutBookingInput {
  return {
    attendeeType: attendee.type,
    name: attendee.name,
    dob: parseDateOnly(attendee.dob),
    nationality: attendee.nationality,
    address: attendee.address,
    passportCnic: attendee.passportCnic,
    passportCnicExpiry: attendee.passportCnicExpiry,
    contactNo: attendee.contactNo,
    email: attendee.email,
    guardianContact: attendee.guardianContact,
  };
}

function invalidField(field: string, message: string): AppException {
  return new AppException(ResponseCode.InvalidData, HttpStatus.UNPROCESSABLE_ENTITY, {
    [field]: [message],
  });
}
