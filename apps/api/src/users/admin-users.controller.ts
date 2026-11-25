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
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { IdListDto } from '../common/dto/id-list.dto.js';
import type { PaginatedResult } from '../common/pagination/paginated-result.js';
import { CreateUserDto, ListUsersQueryDto, UpdateUserDto } from './dto/admin-user.dto.js';
import type { UserProfile } from './user-profile.js';
import { UsersService } from './users.service.js';

@ApiTags('Admin: users')
@ApiBearerAuth()
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('user_access')
  list(@Query() query: ListUsersQueryDto): Promise<PaginatedResult<UserProfile>> {
    return this.usersService.list(query);
  }

  @Get(':id')
  @RequirePermissions('user_show')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserProfile> {
    return this.usersService.getProfile(id);
  }

  /** Also replaces Laravel's `users/storeCustomer` quick-create used on the booking form. */
  @Post()
  @RequirePermissions('user_create')
  create(@Body() dto: CreateUserDto): Promise<UserProfile> {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('user_edit')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto): Promise<UserProfile> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('user_delete')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.usersService.getProfile(id);
    await this.usersService.softDelete([id]);
  }

  @Delete()
  @RequirePermissions('user_delete')
  @HttpCode(HttpStatus.OK)
  removeMany(@Body() dto: IdListDto): Promise<void> {
    return this.usersService.softDelete(dto.ids);
  }
}
