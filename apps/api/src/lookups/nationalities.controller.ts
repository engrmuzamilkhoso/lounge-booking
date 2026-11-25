import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { LookupResponse } from './lookup.dto.js';
import { NationalitiesService } from './nationalities.service.js';

@ApiTags('Catalog')
@ApiBearerAuth()
@Controller('nationalities')
export class NationalitiesController {
  constructor(private readonly nationalitiesService: NationalitiesService) {}

  /** Options for the child/infant nationality dropdown on the booking form. */
  @Get()
  findAll(): Promise<LookupResponse[]> {
    return this.nationalitiesService.findAll();
  }
}
