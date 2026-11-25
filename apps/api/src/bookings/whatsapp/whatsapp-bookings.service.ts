import { Injectable } from '@nestjs/common';
import { formatDateOnly, parseDateOnly } from '../../common/date-only.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { formatTimeOfDayWithSeconds, parseTimeOfDay } from '../booking-response.js';
import type { CreateWhatsappBookingDto, WhatsappBookingResponse } from './whatsapp-booking.dto.js';

/**
 * Stores WhatsApp booking requests as Laravel did. They are not linked to a customer account
 * and have no admin screen yet (none existed in Laravel).
 */
@Injectable()
export class WhatsappBookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWhatsappBookingDto): Promise<WhatsappBookingResponse> {
    const booking = await this.prisma.whatsappBooking.create({
      data: {
        service: dto.service,
        amount: dto.amount,
        departureDate: parseDateOnly(dto.departureDate),
        departureTime: parseTimeOfDay(dto.departureTime),
        adultQty: dto.adultQty,
        childQty: dto.childQty,
        infantQty: dto.infantQty,
      },
    });

    return {
      id: booking.id,
      service: booking.service,
      amount: booking.amount.toNumber(),
      departureDate: formatDateOnly(booking.departureDate),
      departureTime: formatTimeOfDayWithSeconds(booking.departureTime),
      adultQty: booking.adultQty,
      childQty: booking.childQty,
      infantQty: booking.infantQty,
      createdAt: booking.createdAt === null ? null : booking.createdAt.toISOString(),
    };
  }
}
