import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { CardResponse } from './card.dto.js';
import { CardsService } from './cards.service.js';

@ApiTags('Catalog')
@ApiBearerAuth()
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  /** Bank cards offered on the Lounge booking form (active cards only). */
  @Get()
  findActive(): Promise<CardResponse[]> {
    return this.cardsService.findActive();
  }
}
