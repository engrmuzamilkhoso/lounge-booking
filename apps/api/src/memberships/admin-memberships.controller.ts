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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuditActor, CurrentAuditActor } from '../audit/audit-actor.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { IdListDto } from '../common/dto/id-list.dto.js';
import type { PaginatedResult } from '../common/pagination/paginated-result.js';
import {
  ApproveMembershipDto,
  ListMembershipsQueryDto,
  type MembershipResponse,
  SaveMembershipDto,
} from './dto/membership.dto.js';
import { MembershipsService } from './memberships.service.js';

@ApiTags('Admin: memberships')
@ApiBearerAuth()
@Controller('admin/memberships')
export class AdminMembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @RequirePermissions('membership_access')
  list(@Query() query: ListMembershipsQueryDto): Promise<PaginatedResult<MembershipResponse>> {
    return this.membershipsService.list(query);
  }

  /** Pre-fills the approval form (declared before `:id` so it is not read as an id). */
  @Get('next-serial-no')
  @RequirePermissions('approve_membership')
  getNextSerialNo(): Promise<{ serialNo: string }> {
    return this.membershipsService.getNextSerialNo();
  }

  @Get(':id')
  @RequirePermissions('membership_show')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<MembershipResponse> {
    return this.membershipsService.findOne(id);
  }

  @Post()
  @RequirePermissions('membership_create')
  create(
    @Body() dto: SaveMembershipDto,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<MembershipResponse> {
    return this.membershipsService.create(dto, actor);
  }

  @Patch(':id')
  @RequirePermissions('membership_edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveMembershipDto,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<MembershipResponse> {
    return this.membershipsService.update(id, dto, actor);
  }

  @Post(':id/approve')
  @RequirePermissions('approve_membership')
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveMembershipDto,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<MembershipResponse> {
    return this.membershipsService.approve(id, dto, actor);
  }

  @Delete(':id')
  @RequirePermissions('membership_delete')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<void> {
    await this.membershipsService.findOne(id);
    await this.membershipsService.softDelete([id], actor);
  }

  @Delete()
  @RequirePermissions('membership_delete')
  @HttpCode(HttpStatus.OK)
  removeMany(@Body() dto: IdListDto, @CurrentAuditActor() actor: AuditActor): Promise<void> {
    return this.membershipsService.softDelete(dto.ids, actor);
  }
}
