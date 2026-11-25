import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ServiceResponse } from './service.dto.js';
import { ServiceCatalogService } from './service-catalog.service.js';

/** Replaces the mobile `lounge_service/list` endpoint and the website's service pages. */
@ApiTags('Catalog')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(private readonly serviceCatalogService: ServiceCatalogService) {}

  @Get()
  findAll(): Promise<ServiceResponse[]> {
    return this.serviceCatalogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ServiceResponse> {
    return this.serviceCatalogService.findOne(id);
  }
}
