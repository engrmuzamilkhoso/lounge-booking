import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator.js';
import { renderInquiryEmail } from '../mail/templates/inquiry-emails.js';
import { MailService } from '../mail/mail.service.js';
import { CreateInquiryDto } from './create-inquiry.dto.js';

const INQUIRY_LIMIT = { default: { limit: 5, ttl: 60_000 } };

@ApiTags('Content')
@Controller('inquiries')
export class InquiriesController {
  private readonly logger = new Logger(InquiriesController.name);

  constructor(private readonly mailService: MailService) {}

  /**
   * Emails the inquiry to staff and a copy to the address given in the form, as Laravel did.
   * Inquiries are not stored. The per-IP limit restricts how often the form can be used to
   * send mail to an arbitrary address.
   */
  @Public()
  @Throttle(INQUIRY_LIMIT)
  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Body() dto: CreateInquiryDto): Promise<void> {
    const isBot = dto.website !== undefined && dto.website !== '';
    if (isBot) {
      // Answer like a normal submission so the bot learns nothing.
      this.logger.warn('Inquiry rejected by honeypot');
      return;
    }

    await this.mailService.sendToStaff(
      renderInquiryEmail({
        name: dto.name,
        company: dto.company,
        email: dto.email,
        phone: dto.phone,
        message: dto.message,
      }),
      [dto.email],
    );
  }
}
