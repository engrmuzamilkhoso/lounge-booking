import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../config/environment.js';
import type { EmailAttachment } from '../mail/mail.service.js';
import { renderBookingConfirmationEmail } from '../mail/templates/booking-emails.js';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { renderPassQrPng } from './passes/pass-qr-code.js';
import { isSettled } from './passes/pass-status.js';

const PASS_QR_CONTENT_ID = 'lounge-pass-qr';

/**
 * Sends Laravel's "booking placed" email (orderMail) to staff and the customer. Free bookings
 * get it when they are created; bookings that must be paid get it once payment is confirmed.
 * Settled bookings include the lounge pass QR code, so the customer has it in their inbox.
 */
@Injectable()
export class BookingConfirmationMailer {
  private readonly webUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    configService: ConfigService<Environment, true>,
  ) {
    this.webUrl = configService.get('WEB_URL', { infer: true });
  }

  async send(bookingId: number): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        code: true,
        adultQty: true,
        childQty: true,
        infantQty: true,
        paymentStatus: true,
        passToken: true,
        customer: { select: { firstName: true, email: true } },
      },
    });
    if (booking === null || booking.customer === null) {
      return;
    }

    const hasPass = isSettled(booking.paymentStatus);
    const content = renderBookingConfirmationEmail({
      customerName: booking.customer.firstName ?? '',
      code: booking.code,
      adults: booking.adultQty ?? 0,
      children: booking.childQty ?? 0,
      infants: booking.infantQty ?? 0,
      passQrContentId: hasPass ? PASS_QR_CONTENT_ID : undefined,
    });
    if (hasPass) {
      content.attachments = [await this.passAttachment(booking.code, booking.passToken)];
    }
    await this.mailService.sendToStaff(content, [booking.customer.email]);
  }

  private async passAttachment(code: string, passToken: string): Promise<EmailAttachment> {
    return {
      filename: `majestic-pass-${code}.png`,
      content: await renderPassQrPng(this.webUrl, passToken),
      contentType: 'image/png',
      contentId: PASS_QR_CONTENT_ID,
    };
  }
}
