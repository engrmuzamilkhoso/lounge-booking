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
import { type LookupResponse, SaveSourceRequestDto } from './lookup.dto.js';
import { SourceRequestsService } from './source-requests.service.js';

@ApiTags('Admin: booking sources')
@ApiBearerAuth()
@Controller('admin/source-requests')
export class AdminSourceRequestsController {
  constructor(private readonly sourceRequestsService: SourceRequestsService) {}

  @Get()
  @RequirePermissions('source_request_access')
  findAll(): Promise<LookupResponse[]> {
    return this.sourceRequestsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('source_request_show')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<LookupResponse> {
    return this.sourceRequestsService.findOne(id);
  }

  @Post()
  @RequirePermissions('source_request_create')
  create(
    @Body() dto: SaveSourceRequestDto,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<LookupResponse> {
    return this.sourceRequestsService.create(dto, actor);
  }

  @Patch(':id')
  @RequirePermissions('source_request_edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveSourceRequestDto,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<LookupResponse> {
    return this.sourceRequestsService.update(id, dto, actor);
  }

  @Delete(':id')
  @RequirePermissions('source_request_delete')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<void> {
    await this.sourceRequestsService.findOne(id);
    await this.sourceRequestsService.softDelete([id], actor);
  }

  @Delete()
  @RequirePermissions('source_request_delete')
  @HttpCode(HttpStatus.OK)
  removeMany(@Body() dto: IdListDto, @CurrentAuditActor() actor: AuditActor): Promise<void> {
    return this.sourceRequestsService.softDelete(dto.ids, actor);
  }
}
