import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { ResponseCode, SourceRequestId } from '@booking/shared-types';
import { type AuditActor, CurrentAuditActor } from '../audit/audit-actor.js';
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AppException } from '../common/http/app.exception.js';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import type { PaginatedResult } from '../common/pagination/paginated-result.js';
import { BookingCreationService } from './booking-creation.service.js';
import type { BookingResponse } from './booking-response.js';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/booking.dto.js';

const MAX_IDEMPOTENCY_KEY_LENGTH = 100;

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller()
export class BookingsController {
  constructor(
    private readonly bookingCreationService: BookingCreationService,
    private readonly bookingsService: BookingsService,
  ) {}

  /**
   * Places a booking for the signed-in customer (website and app).
   * Send a unique `Idempotency-Key` per booking attempt (e.g. a UUID created when the form
   * opens); resubmitting with the same key returns the original booking instead of a duplicate.
   */
  @Post('bookings')
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @CurrentAuditActor() actor: AuditActor,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): Promise<BookingResponse> {
    const { platform, expectedTotalAmount, ...details } = dto;
    return this.bookingCreationService.create({
      details,
      customerId: currentUser.id,
      sourceRequestId: platform === 'app' ? SourceRequestId.App : SourceRequestId.Web,
      expectedTotalAmount,
      idempotencyKey: validateIdempotencyKey(idempotencyKey),
      rejectPastDepartures: true,
      sendConfirmationEmail: true,
      actor,
    });
  }

  @Get('me/bookings')
  listMine(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<BookingResponse>> {
    return this.bookingsService.listForCustomer(currentUser.id, query);
  }

  @Get('me/bookings/:id')
  findMine(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BookingResponse> {
    return this.bookingsService.findForCustomer(currentUser.id, id);
  }
}

function validateIdempotencyKey(idempotencyKey: string | undefined): string | undefined {
  if (idempotencyKey === undefined || idempotencyKey === '') {
    return undefined;
  }
  if (idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
    throw new AppException(ResponseCode.InvalidData, HttpStatus.UNPROCESSABLE_ENTITY, {
      'Idempotency-Key': [`must be at most ${MAX_IDEMPOTENCY_KEY_LENGTH} characters`],
    });
  }
  return idempotencyKey;
}
