import { Body, Controller, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import {
  type CheckoutSession,
  type PaymentConfirmation,
  PaymentsService,
  type RefreshedPayment,
} from './payments.service.js';

export class ConfirmPaymentDto {
  /** The `tracker` query parameter Safepay appends to the return URL. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^track_[A-Za-z0-9-]+$/, { message: 'tracker is not a Safepay tracker token' })
  tracker: string;
}

const PAYMENT_LIMIT = { default: { limit: 20, ttl: 60_000 } };

@ApiTags('Payments')
@ApiBearerAuth()
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Starts (or resumes) online payment of one of the customer's bookings and returns the
   * Safepay hosted-checkout URL to redirect to. The amount is the booking's stored total.
   */
  @Throttle(PAYMENT_LIMIT)
  @Post('bookings/:id/checkout')
  @HttpCode(HttpStatus.OK)
  startCheckout(
    @Param('id', ParseIntPipe) bookingId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<CheckoutSession> {
    return this.paymentsService.startCheckout(bookingId, currentUser.id);
  }

  /** Called by the website when Safepay redirects back; verifies the payment with Safepay. */
  @Throttle(PAYMENT_LIMIT)
  @Post('payments/safepay/confirm')
  @HttpCode(HttpStatus.OK)
  confirm(
    @Body() dto: ConfirmPaymentDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<PaymentConfirmation> {
    return this.paymentsService.confirmFromRedirect(dto.tracker, currentUser.id);
  }

  /**
   * Re-checks the booking's latest unfinished payment with Safepay, for when the customer paid
   * but never came back to the website (lost connection). Returns the booking's payment status.
   */
  @Throttle(PAYMENT_LIMIT)
  @Post('bookings/:id/payment/refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @Param('id', ParseIntPipe) bookingId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<RefreshedPayment> {
    return this.paymentsService.refreshBookingPayment(bookingId, currentUser.id);
  }
}
