import { Injectable } from '@nestjs/common';
import { renderBookingConfirmationEmail } from '../mail/templates/booking-emails.js';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Sends Laravel's "booking placed" email (orderMail) to staff and the customer. Free bookings
 * get it when they are created; bookings that must be paid get it once payment is confirmed.
 */
@Injectable()
export class BookingConfirmationMailer {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async send(bookingId: number): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        code: true,
        adultQty: true,
        childQty: true,
        infantQty: true,
        customer: { select: { firstName: true, email: true } },
      },
    });
    if (booking === null || booking.customer === null) {
      return;
    }

    const content = renderBookingConfirmationEmail({
      customerName: booking.customer.firstName ?? '',
      code: booking.code,
      adults: booking.adultQty ?? 0,
      children: booking.childQty ?? 0,
      infants: booking.infantQty ?? 0,
    });
    await this.mailService.sendToStaff(content, [booking.customer.email]);
  }
}
