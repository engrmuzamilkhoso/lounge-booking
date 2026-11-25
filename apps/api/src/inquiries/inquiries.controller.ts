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
   * Emails the inquiry to staff. Inquiries are not stored, as in Laravel.
   *
   * Laravel also sent a copy to the address typed into the form; that let anyone send email
   * with their own text through this server to any address, so the copy is not sent.
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
    );
  }
}
