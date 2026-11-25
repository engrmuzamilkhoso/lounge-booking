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
import type { PermissionResponse } from './permission.dto.js';
import { SavePermissionDto } from './permission.dto.js';
import { PermissionsService } from './permissions.service.js';

@ApiTags('Admin: permissions')
@ApiBearerAuth()
@Controller('admin/permissions')
export class AdminPermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('permission_access')
  findAll(): Promise<PermissionResponse[]> {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('permission_show')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PermissionResponse> {
    return this.permissionsService.findOne(id);
  }

  @Post()
  @RequirePermissions('permission_create')
  create(@Body() dto: SavePermissionDto): Promise<PermissionResponse> {
    return this.permissionsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('permission_edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SavePermissionDto,
  ): Promise<PermissionResponse> {
    return this.permissionsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('permission_delete')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.permissionsService.findOne(id);
    await this.permissionsService.softDelete([id]);
  }

  @Delete()
  @RequirePermissions('permission_delete')
  @HttpCode(HttpStatus.OK)
  removeMany(@Body() dto: IdListDto): Promise<void> {
    return this.permissionsService.softDelete(dto.ids);
  }
}
