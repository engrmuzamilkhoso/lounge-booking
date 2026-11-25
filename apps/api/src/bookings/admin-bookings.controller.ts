import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SourceRequestId } from '@booking/shared-types';
import { type AuditActor, CurrentAuditActor } from '../audit/audit-actor.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { IdListDto } from '../common/dto/id-list.dto.js';
import type { PaginatedResult } from '../common/pagination/paginated-result.js';
import { BookingAttendeesService } from './booking-attendees.service.js';
import { BookingCreationService } from './booking-creation.service.js';
import type { AttendeeResponse, BookingResponse } from './booking-response.js';
import { BookingsService } from './bookings.service.js';
import { AttendeeDto, UpdateAttendeeDto } from './dto/attendee.dto.js';
import {
  AdminCreateBookingDto,
  ListBookingsQueryDto,
  UpdateBookingDto,
} from './dto/booking.dto.js';

@ApiTags('Admin: bookings')
@ApiBearerAuth()
@Controller('admin/bookings')
export class AdminBookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly bookingCreationService: BookingCreationService,
    private readonly bookingAttendeesService: BookingAttendeesService,
  ) {}

  @Get()
  @RequirePermissions('booking_access')
  list(@Query() query: ListBookingsQueryDto): Promise<PaginatedResult<BookingResponse>> {
    return this.bookingsService.listForAdmin(query);
  }

  @Get(':id')
  @RequirePermissions('booking_show')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<BookingResponse> {
    return this.bookingsService.findForAdmin(id);
  }

  /**
   * Booking entered by staff for a customer. Same rules and price as a customer booking,
   * except that past departure dates are allowed. Recorded with source "Web" and no
   * confirmation email, as Laravel's admin form did.
   */
  @Post()
  @RequirePermissions('booking_create')
  create(
    @Body() dto: AdminCreateBookingDto,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<BookingResponse> {
    const { customerId, ...details } = dto;
    return this.bookingCreationService.create({
      details,
      customerId,
      sourceRequestId: SourceRequestId.Web,
      rejectPastDepartures: false,
      sendConfirmationEmail: false,
      actor,
    });
  }

  @Patch(':id')
  @RequirePermissions('booking_edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingDto,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<BookingResponse> {
    return this.bookingsService.update(id, dto, actor);
  }

  @Delete(':id')
  @RequirePermissions('booking_delete')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<void> {
    await this.bookingsService.findForAdmin(id);
    await this.bookingsService.softDelete([id], actor);
  }

  @Delete()
  @RequirePermissions('booking_delete')
  @HttpCode(HttpStatus.OK)
  removeMany(@Body() dto: IdListDto, @CurrentAuditActor() actor: AuditActor): Promise<void> {
    return this.bookingsService.softDelete(dto.ids, actor);
  }

  // ───────────────────────────── Passengers ──────────────────────────────

  @Post(':id/attendees')
  @RequirePermissions('booking_detail_create')
  addAttendee(
    @Param('id', ParseIntPipe) bookingId: number,
    @Body() dto: AttendeeDto,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<AttendeeResponse> {
    return this.bookingAttendeesService.add(bookingId, dto, actor);
  }

  @Patch(':id/attendees/:attendeeId')
  @RequirePermissions('booking_detail_edit')
  updateAttendee(
    @Param('id', ParseIntPipe) bookingId: number,
    @Param('attendeeId', ParseIntPipe) attendeeId: number,
    @Body() dto: UpdateAttendeeDto,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<AttendeeResponse> {
    return this.bookingAttendeesService.update(bookingId, attendeeId, dto, actor);
  }

  @Delete(':id/attendees/:attendeeId')
  @RequirePermissions('booking_detail_delete')
  @HttpCode(HttpStatus.OK)
  removeAttendee(
    @Param('id', ParseIntPipe) bookingId: number,
    @Param('attendeeId', ParseIntPipe) attendeeId: number,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<void> {
    return this.bookingAttendeesService.remove(bookingId, attendeeId, actor);
  }
}
