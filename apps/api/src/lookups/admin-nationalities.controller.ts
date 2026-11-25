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
import { type AuditActor, CurrentAuditActor } from '../audit/audit-actor.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { IdListDto } from '../common/dto/id-list.dto.js';
import { type LookupResponse, SaveNationalityDto } from './lookup.dto.js';
import { NationalitiesService } from './nationalities.service.js';

@ApiTags('Admin: nationalities')
@ApiBearerAuth()
@Controller('admin/nationalities')
export class AdminNationalitiesController {
  constructor(private readonly nationalitiesService: NationalitiesService) {}

  @Get()
  @RequirePermissions('nationality_access')
  findAll(): Promise<LookupResponse[]> {
    return this.nationalitiesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('nationality_show')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<LookupResponse> {
    return this.nationalitiesService.findOne(id);
  }

  @Post()
  @RequirePermissions('nationality_create')
  create(
    @Body() dto: SaveNationalityDto,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<LookupResponse> {
    return this.nationalitiesService.create(dto, actor);
  }

  @Patch(':id')
  @RequirePermissions('nationality_edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveNationalityDto,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<LookupResponse> {
    return this.nationalitiesService.update(id, dto, actor);
  }

  @Delete(':id')
  @RequirePermissions('nationality_delete')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<void> {
    await this.nationalitiesService.findOne(id);
    await this.nationalitiesService.softDelete([id], actor);
  }

  @Delete()
  @RequirePermissions('nationality_delete')
  @HttpCode(HttpStatus.OK)
  removeMany(@Body() dto: IdListDto, @CurrentAuditActor() actor: AuditActor): Promise<void> {
    return this.nationalitiesService.softDelete(dto.ids, actor);
  }
}
