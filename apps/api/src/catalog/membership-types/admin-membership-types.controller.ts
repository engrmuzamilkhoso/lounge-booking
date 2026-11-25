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
import { type AuditActor, CurrentAuditActor } from '../../audit/audit-actor.js';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator.js';
import { IdListDto } from '../../common/dto/id-list.dto.js';
import { type MembershipTypeResponse, SaveMembershipTypeDto } from './membership-type.dto.js';
import { MembershipTypesService } from './membership-types.service.js';

@ApiTags('Admin: membership types')
@ApiBearerAuth()
@Controller('admin/membership-types')
export class AdminMembershipTypesController {
  constructor(private readonly membershipTypesService: MembershipTypesService) {}

  @Get()
  @RequirePermissions('membership_type_access')
  findAll(): Promise<MembershipTypeResponse[]> {
    return this.membershipTypesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('membership_type_show')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<MembershipTypeResponse> {
    return this.membershipTypesService.findOne(id);
  }

  @Post()
  @RequirePermissions('membership_type_create')
  create(
    @Body() dto: SaveMembershipTypeDto,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<MembershipTypeResponse> {
    return this.membershipTypesService.create(dto, actor);
  }

  @Patch(':id')
  @RequirePermissions('membership_type_edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveMembershipTypeDto,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<MembershipTypeResponse> {
    return this.membershipTypesService.update(id, dto, actor);
  }

  @Delete(':id')
  @RequirePermissions('membership_type_delete')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<void> {
    await this.membershipTypesService.findOne(id);
    await this.membershipTypesService.softDelete([id], actor);
  }

  @Delete()
  @RequirePermissions('membership_type_delete')
  @HttpCode(HttpStatus.OK)
  removeMany(@Body() dto: IdListDto, @CurrentAuditActor() actor: AuditActor): Promise<void> {
    return this.membershipTypesService.softDelete(dto.ids, actor);
  }
}
