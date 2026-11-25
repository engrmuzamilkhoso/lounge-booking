import { Module } from '@nestjs/common';
import { MembershipsModule } from '../memberships/memberships.module.js';
import { AdminBookingsController } from './admin-bookings.controller.js';
import { BookingAttendeesService } from './booking-attendees.service.js';
import { BookingConfirmationMailer } from './booking-confirmation.mailer.js';
import { BookingCreationService } from './booking-creation.service.js';
import { BookingsController } from './bookings.controller.js';
import { BookingsService } from './bookings.service.js';
import { WhatsappBookingsController } from './whatsapp/whatsapp-bookings.controller.js';
import { WhatsappBookingsService } from './whatsapp/whatsapp-bookings.service.js';

@Module({
  imports: [MembershipsModule],
  controllers: [BookingsController, AdminBookingsController, WhatsappBookingsController],
  providers: [
    BookingCreationService,
    BookingsService,
    BookingAttendeesService,
    WhatsappBookingsService,
    BookingConfirmationMailer,
  ],
  exports: [BookingConfirmationMailer],
})
export class BookingsModule {}
