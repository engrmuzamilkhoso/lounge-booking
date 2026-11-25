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
import { type LookupResponse, SaveStatusDto } from './lookup.dto.js';
import { StatusesService } from './statuses.service.js';

@ApiTags('Admin: statuses')
@ApiBearerAuth()
@Controller('admin/statuses')
export class AdminStatusesController {
  constructor(private readonly statusesService: StatusesService) {}

  @Get()
  @RequirePermissions('status_access')
  findAll(): Promise<LookupResponse[]> {
    return this.statusesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('status_show')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<LookupResponse> {
    return this.statusesService.findOne(id);
  }

  @Post()
  @RequirePermissions('status_create')
  create(
    @Body() dto: SaveStatusDto,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<LookupResponse> {
    return this.statusesService.create(dto, actor);
  }

  @Patch(':id')
  @RequirePermissions('status_edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveStatusDto,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<LookupResponse> {
    return this.statusesService.update(id, dto, actor);
  }

  @Delete(':id')
  @RequirePermissions('status_delete')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<void> {
    await this.statusesService.findOne(id);
    await this.statusesService.softDelete([id], actor);
  }

  @Delete()
  @RequirePermissions('status_delete')
  @HttpCode(HttpStatus.OK)
  removeMany(@Body() dto: IdListDto, @CurrentAuditActor() actor: AuditActor): Promise<void> {
    return this.statusesService.softDelete(dto.ids, actor);
  }
}
