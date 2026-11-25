import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator.js';
import type { FaqQuestionResponse } from './faq.dto.js';
import { FaqService } from './faq.service.js';

@ApiTags('Content')
@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  /** Public, like Laravel's `/faq` page. */
  @Public()
  @Get()
  findAll(): Promise<FaqQuestionResponse[]> {
    return this.faqService.findAllQuestions();
  }
}
