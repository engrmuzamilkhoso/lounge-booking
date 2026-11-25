import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingPaymentStatus, PaymentStatus, ResponseCode } from '@booking/shared-types';
import { BookingConfirmationMailer } from '../bookings/booking-confirmation.mailer.js';
import { AppException } from '../common/http/app.exception.js';
import { recordNotFound } from '../common/http/not-found.js';
import type { Environment } from '../config/environment.js';
import type { Prisma } from '../generated/prisma/client.js';
import { isUniqueConstraintViolation } from '../prisma/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  bookingStatusFor,
  nextPaymentStatus,
  outcomeOfTrackerState,
  rupeesToPaisa,
} from './payment-outcome.js';
import { type PaymentReport, SafepayClient, SafepayError } from './safepay/safepay.client.js';

const GATEWAY = 'safepay';
const CURRENCY = 'PKR';
/**
 * Safepay's checkout token lives one hour. An open session older than this is re-checked with
 * Safepay and replaced, rather than reused.
 */
const REUSABLE_SESSION_AGE_MS = 50 * 60 * 1000;

export interface CheckoutSession {
  checkoutUrl: string;
  /** PKR */
  amount: number;
  currency: string;
}

export interface PaymentConfirmation {
  bookingId: number;
  bookingCode: string;
  bookingPaymentStatus: BookingPaymentStatus;
  paymentStatus: PaymentStatus;
}

export interface RefreshedPayment {
  bookingPaymentStatus: BookingPaymentStatus;
}

interface OpenPayment {
  id: number;
  gatewayReference: string;
  amountMinor: number;
  createdAt: Date;
}

/**
 * Online payment of bookings through Safepay's hosted checkout.
 *
 * Rules:
 * - The amount always comes from the booking stored on the server, never from the browser.
 * - A booking has at most one open Safepay session; refreshing or clicking "Pay" again reuses it
 *   (a partial unique index in the database guarantees this even under concurrent requests).
 * - A payment counts as paid only when Safepay's reporting API says so for the expected amount
 *   and currency. Redirect parameters and webhook bodies only trigger that check.
 * - Status changes happen under a row lock and follow a small state machine, so repeated
 *   webhooks or redirects are harmless; the confirmation email is sent exactly once.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly webUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly safepayClient: SafepayClient,
    private readonly bookingConfirmationMailer: BookingConfirmationMailer,
    configService: ConfigService<Environment, true>,
  ) {
    this.webUrl = configService.get('WEB_URL', { infer: true });
  }

  /** Creates (or reuses) the Safepay session for a customer's booking and returns its URL. */
  async startCheckout(bookingId: number, customerId: number): Promise<CheckoutSession> {
    if (!this.safepayClient.isConfigured) {
      throw new AppException(ResponseCode.PaymentsUnavailable, HttpStatus.SERVICE_UNAVAILABLE);
    }

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, customerId, deletedAt: null },
      select: { id: true, code: true, totalAmount: true, paymentStatus: true },
    });
    if (booking === null) {
      throw recordNotFound();
    }
    this.assertBookingIsPayable(booking.paymentStatus, booking.totalAmount);

    const amountMinor = rupeesToPaisa(booking.totalAmount ?? 0);
    try {
      const tracker = await this.findOrCreateOpenSession(
        booking.id,
        booking.code,
        customerId,
        amountMinor,
      );
      const checkoutToken = await this.safepayClient.createCheckoutToken();
      const checkoutUrl = this.safepayClient.buildCheckoutUrl({
        tracker,
        checkoutToken,
        orderId: booking.code,
        redirectUrl: `${this.webUrl}/checkout/${booking.id}/complete`,
        cancelUrl: `${this.webUrl}/checkout/${booking.id}?payment=cancelled`,
      });
      return { checkoutUrl, amount: amountMinor / 100, currency: CURRENCY };
    } catch (error) {
      throw toGatewayException(error);
    }
  }

  /**
   * Called when Safepay sends the customer back (`?tracker=…`). The tracker is only used to
   * look the payment up; its outcome comes from Safepay's API.
   */
  async confirmFromRedirect(tracker: string, customerId: number): Promise<PaymentConfirmation> {
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayReference: tracker, booking: { customerId, deletedAt: null } },
      select: { id: true },
    });
    if (payment === null) {
      throw recordNotFound();
    }

    try {
      const report = await this.safepayClient.fetchPayment(tracker);
      await this.applyReport(payment.id, report, false);
    } catch (error) {
      throw toGatewayException(error);
    }
    return this.describe(payment.id);
  }

  /** Webhook trigger (signature already verified): re-check the payment with Safepay. */
  async handleWebhookEvent(eventType: string, tracker: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { gatewayReference: tracker },
      select: { id: true },
    });
    if (payment === null) {
      // Not created by this application (or another environment); acknowledge and ignore.
      this.logger.warn({ eventType, tracker }, 'Safepay webhook for an unknown payment');
      return;
    }
    const report = await this.safepayClient.fetchPayment(tracker);
    await this.applyReport(payment.id, report, eventType === 'payment.failed');
  }

  private assertBookingIsPayable(paymentStatus: string, totalAmount: number | null): void {
    if (paymentStatus === BookingPaymentStatus.Paid) {
      throw new AppException(ResponseCode.AlreadyPaid, HttpStatus.CONFLICT);
    }
    const isPayable =
      (paymentStatus === BookingPaymentStatus.Pending ||
        paymentStatus === BookingPaymentStatus.Failed) &&
      totalAmount !== null &&
      totalAmount > 0;
    if (!isPayable) {
      throw new AppException(ResponseCode.PaymentNotRequired, HttpStatus.CONFLICT);
    }
  }

  /**
   * Customer asks "did my payment go through?" (e.g. the connection dropped before Safepay
   * could send them back). Re-checks the booking's most recent unfinished attempt with Safepay.
   */
  async refreshBookingPayment(bookingId: number, customerId: number): Promise<RefreshedPayment> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, customerId, deletedAt: null },
      select: { id: true, paymentStatus: true },
    });
    if (booking === null) {
      throw recordNotFound();
    }

    const payment = await this.prisma.payment.findFirst({
      where: { bookingId, status: { in: [PaymentStatus.Pending, PaymentStatus.Failed] } },
      orderBy: { id: 'desc' },
      select: { id: true, gatewayReference: true },
    });
    if (payment === null || !this.safepayClient.isConfigured) {
      return { bookingPaymentStatus: booking.paymentStatus as BookingPaymentStatus };
    }

    try {
      await this.reconcilePayment(payment.id, payment.gatewayReference);
    } catch (error) {
      throw toGatewayException(error);
    }
    const updated = await this.prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      select: { paymentStatus: true },
    });
    return { bookingPaymentStatus: updated.paymentStatus as BookingPaymentStatus };
  }

  /**
   * Asks Safepay for the current state of one payment attempt and applies it. Safe to call any
   * number of times, from any process: the row lock and state machine make it idempotent.
   */
  async reconcilePayment(paymentId: number, tracker: string): Promise<PaymentStatus> {
    const report = await this.safepayClient.fetchPayment(tracker);
    const result = await this.applyReport(paymentId, report, false);
    return result.status;
  }

  /** Returns the tracker of the booking's open session, creating one when needed. */
  private async findOrCreateOpenSession(
    bookingId: number,
    bookingCode: string,
    customerId: number,
    amountMinor: number,
  ): Promise<string> {
    const openPayment = await this.findOpenPayment(bookingId);
    if (openPayment !== null) {
      // Always ask Safepay first: the customer may have paid on this session and lost their
      // connection before being sent back. Paying again must never be offered in that case.
      const status = await this.reconcilePayment(openPayment.id, openPayment.gatewayReference);
      if (status === PaymentStatus.Paid) {
        throw new AppException(ResponseCode.AlreadyPaid, HttpStatus.CONFLICT);
      }
      const isFresh = Date.now() - openPayment.createdAt.getTime() < REUSABLE_SESSION_AGE_MS;
      if (status === PaymentStatus.Pending && isFresh && openPayment.amountMinor === amountMinor) {
        return openPayment.gatewayReference;
      }
      await this.cancelIfStillPending(openPayment.id);
    }

    const tracker = await this.safepayClient.createTracker({
      amountMinor,
      currency: CURRENCY,
      orderId: bookingCode,
    });
    try {
      await this.prisma.$transaction([
        this.prisma.payment.create({
          data: {
            bookingId,
            customerId,
            gateway: GATEWAY,
            gatewayReference: tracker.token,
            amountMinor,
            currency: CURRENCY,
            status: PaymentStatus.Pending,
            gatewayState: tracker.state,
          },
        }),
        this.prisma.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: BookingPaymentStatus.Pending },
        }),
      ]);
      return tracker.token;
    } catch (error) {
      // Another request opened a session at the same moment; use that one. The tracker created
      // here is simply never used, so nothing can be charged on it.
      if (!isUniqueConstraintViolation(error)) {
        throw error;
      }
      const winner = await this.findOpenPayment(bookingId);
      if (winner === null) {
        throw error;
      }
      return winner.gatewayReference;
    }
  }

  private findOpenPayment(bookingId: number): Promise<OpenPayment | null> {
    return this.prisma.payment.findFirst({
      where: { bookingId, status: PaymentStatus.Pending },
      select: { id: true, gatewayReference: true, amountMinor: true, createdAt: true },
    });
  }

  /**
   * Closes a session that Safepay just reported as unpaid (it is being replaced, or it is too
   * old to be paid any more). If Safepay later reports it paid after all, the state machine
   * still accepts cancelled → paid.
   */
  async cancelIfStillPending(paymentId: number): Promise<void> {
    await this.prisma.payment.updateMany({
      where: { id: paymentId, status: PaymentStatus.Pending },
      data: { status: PaymentStatus.Cancelled },
    });
  }

  /**
   * Applies Safepay's report to one payment attempt and its booking, under a row lock so that a
   * webhook and a redirect arriving together cannot both act. Sends the confirmation email when
   * the booking becomes paid.
   */
  private async applyReport(
    paymentId: number,
    report: PaymentReport,
    failureReported: boolean,
  ): Promise<{ status: PaymentStatus }> {
    const result = await this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT id FROM payments WHERE id = ${paymentId} FOR UPDATE`;
      const payment = await transaction.payment.findUniqueOrThrow({
        where: { id: paymentId },
        select: { id: true, bookingId: true, status: true, amountMinor: true, currency: true },
      });
      const currentStatus = payment.status as PaymentStatus;

      let outcome = outcomeOfTrackerState(report.state);
      if (outcome === 'paid' && !this.amountMatches(payment, report)) {
        this.logger.error(
          {
            paymentId,
            expected: payment.amountMinor,
            reported: report.amountMinor,
            currency: report.currency,
          },
          'Safepay reported a different amount or currency; payment not marked as paid',
        );
        outcome = 'in_progress';
      }

      const nextStatus = nextPaymentStatus(currentStatus, outcome, failureReported);
      const isNewlyPaid = nextStatus === PaymentStatus.Paid;

      await transaction.payment.update({
        where: { id: payment.id },
        data: {
          gatewayState: report.state,
          paymentMethod: report.paymentMethod ?? undefined,
          gatewayResponse: toJson(report.raw),
          status: nextStatus ?? undefined,
          paidAt: isNewlyPaid ? new Date() : undefined,
        },
      });

      if (nextStatus !== null) {
        await this.updateBookingStatus(transaction, payment.bookingId, nextStatus);
        this.logger.log(
          { paymentId, from: currentStatus, to: nextStatus, state: report.state },
          'Payment status changed',
        );
      }
      return { status: nextStatus ?? currentStatus, bookingId: payment.bookingId, isNewlyPaid };
    });

    if (result.isNewlyPaid) {
      await this.bookingConfirmationMailer.send(result.bookingId);
    }
    return { status: result.status };
  }

  /** A failed attempt never downgrades a booking that another attempt already paid. */
  private async updateBookingStatus(
    transaction: Prisma.TransactionClient,
    bookingId: number,
    paymentStatus: PaymentStatus,
  ): Promise<void> {
    const bookingStatus = bookingStatusFor(paymentStatus);
    const isDowngrade = bookingStatus === BookingPaymentStatus.Failed;
    await transaction.booking.updateMany({
      where: {
        id: bookingId,
        paymentStatus: isDowngrade ? { not: BookingPaymentStatus.Paid } : undefined,
      },
      data: { paymentStatus: bookingStatus },
    });
  }

  private amountMatches(
    payment: { amountMinor: number; currency: string },
    report: PaymentReport,
  ): boolean {
    if (report.amountMinor === null || report.currency === null) {
      // Safepay did not include totals; the tracker itself was created for this amount.
      return true;
    }
    return report.amountMinor === payment.amountMinor && report.currency === payment.currency;
  }

  private async describe(paymentId: number): Promise<PaymentConfirmation> {
    const payment = await this.prisma.payment.findUniqueOrThrow({
      where: { id: paymentId },
      select: { status: true, booking: { select: { id: true, code: true, paymentStatus: true } } },
    });
    return {
      bookingId: payment.booking.id,
      bookingCode: payment.booking.code,
      bookingPaymentStatus: payment.booking.paymentStatus as BookingPaymentStatus,
      paymentStatus: payment.status as PaymentStatus,
    };
  }
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/** Gateway problems become a clear 502 for the client; our own AppExceptions pass through. */
function toGatewayException(error: unknown): unknown {
  if (error instanceof SafepayError) {
    return new AppException(ResponseCode.PaymentGatewayError, HttpStatus.BAD_GATEWAY);
  }
  return error;
}
