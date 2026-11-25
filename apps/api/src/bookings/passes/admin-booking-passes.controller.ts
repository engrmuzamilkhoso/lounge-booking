import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuditActor, CurrentAuditActor } from '../../audit/audit-actor.js';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator.js';
import { BookingPassesService } from './booking-passes.service.js';
import { FindPassQueryDto } from './find-pass-query.dto.js';
import type { PassVerificationResponse } from './pass-verification.js';

/**
 * Counter staff: verify a customer's lounge pass and check it in. Viewing needs `booking_show`;
 * checking in changes the booking, so it also needs `booking_edit`.
 */
@ApiTags('Admin: booking passes')
@ApiBearerAuth()
@Controller('admin/booking-passes')
export class AdminBookingPassesController {
  constructor(private readonly bookingPassesService: BookingPassesService) {}

  /** Look a pass up by booking reference, for when the QR code cannot be scanned. */
  @Get()
  @RequirePermissions('booking_show')
  findByCode(@Query() query: FindPassQueryDto): Promise<PassVerificationResponse> {
    return this.bookingPassesService.verifyByCode(query.code);
  }

  /** The token is the value in the customer's QR code. */
  @Get(':token')
  @RequirePermissions('booking_show')
  verify(@Param('token') token: string): Promise<PassVerificationResponse> {
    return this.bookingPassesService.verifyByToken(token);
  }

  /** Lets the customer in. Fails with 0024 when already used, 0025 when the pass is not valid. */
  @Post(':token/check-in')
  @RequirePermissions('booking_show', 'booking_edit')
  @HttpCode(HttpStatus.OK)
  checkIn(
    @Param('token') token: string,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<PassVerificationResponse> {
    return this.bookingPassesService.checkIn(token, actor);
  }
}
