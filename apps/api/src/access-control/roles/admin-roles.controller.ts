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
import type { RoleResponse } from './role.dto.js';
import { SaveRoleDto } from './role.dto.js';
import { RolesService } from './roles.service.js';

@ApiTags('Admin: roles')
@ApiBearerAuth()
@Controller('admin/roles')
export class AdminRolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('role_access')
  findAll(): Promise<RoleResponse[]> {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('role_show')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<RoleResponse> {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions('role_create')
  create(@Body() dto: SaveRoleDto): Promise<RoleResponse> {
    return this.rolesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('role_edit')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveRoleDto): Promise<RoleResponse> {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('role_delete')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.rolesService.findOne(id);
    await this.rolesService.softDelete([id]);
  }

  @Delete()
  @RequirePermissions('role_delete')
  @HttpCode(HttpStatus.OK)
  removeMany(@Body() dto: IdListDto): Promise<void> {
    return this.rolesService.softDelete(dto.ids);
  }
}
