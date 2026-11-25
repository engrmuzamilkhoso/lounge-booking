import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator.js';
import { IdListDto } from '../../common/dto/id-list.dto.js';
import { SaveServiceDto, type ServiceResponse } from './service.dto.js';
import { ServiceCatalogService } from './service-catalog.service.js';

@ApiTags('Admin: services')
@ApiBearerAuth()
@Controller('admin/services')
export class AdminServicesController {
  constructor(private readonly serviceCatalogService: ServiceCatalogService) {}

  @Get()
  @RequirePermissions('service_access')
  findAll(): Promise<ServiceResponse[]> {
    return this.serviceCatalogService.findAll();
  }

  @Get(':id')
  @RequirePermissions('service_show')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ServiceResponse> {
    return this.serviceCatalogService.findOne(id);
  }

  @Post()
  @RequirePermissions('service_create')
  create(@Body() dto: SaveServiceDto): Promise<ServiceResponse> {
    return this.serviceCatalogService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('service_edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveServiceDto,
  ): Promise<ServiceResponse> {
    return this.serviceCatalogService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('service_delete')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.serviceCatalogService.findOne(id);
    await this.serviceCatalogService.softDelete([id]);
  }

  @Delete()
  @RequirePermissions('service_delete')
  @HttpCode(HttpStatus.OK)
  removeMany(@Body() dto: IdListDto): Promise<void> {
    return this.serviceCatalogService.softDelete(dto.ids);
  }
}
