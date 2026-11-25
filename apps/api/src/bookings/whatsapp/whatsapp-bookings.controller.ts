import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateWhatsappBookingDto, type WhatsappBookingResponse } from './whatsapp-booking.dto.js';
import { WhatsappBookingsService } from './whatsapp-bookings.service.js';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('whatsapp-bookings')
export class WhatsappBookingsController {
  constructor(private readonly whatsappBookingsService: WhatsappBookingsService) {}

  @Post()
  create(@Body() dto: CreateWhatsappBookingDto): Promise<WhatsappBookingResponse> {
    return this.whatsappBookingsService.create(dto);
  }
}
