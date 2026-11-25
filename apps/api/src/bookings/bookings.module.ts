import { Module } from '@nestjs/common';
import { MembershipsModule } from '../memberships/memberships.module.js';
import { AdminBookingsController } from './admin-bookings.controller.js';
import { BookingAttendeesService } from './booking-attendees.service.js';
import { BookingCreationService } from './booking-creation.service.js';
import { BookingsController } from './bookings.controller.js';
import { BookingsService } from './bookings.service.js';

@Module({
  imports: [MembershipsModule],
  controllers: [BookingsController, AdminBookingsController],
  providers: [BookingCreationService, BookingsService, BookingAttendeesService],
})
export class BookingsModule {}
