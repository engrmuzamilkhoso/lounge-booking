import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ChangeMyPasswordDto, UpdateMyProfileDto } from './dto/me.dto.js';
import type { UserProfile } from './user-profile.js';
import { UsersService } from './users.service.js';

@ApiTags('My account')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getProfile(@CurrentUser() currentUser: AuthenticatedUser): Promise<UserProfile> {
    return this.usersService.getProfile(currentUser.id);
  }

  @Patch()
  updateProfile(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateMyProfileDto,
  ): Promise<UserProfile> {
    return this.usersService.updateProfile(currentUser.id, dto);
  }

  /** Signs out all sessions, including the current one; the client must log in again. */
  @Patch('password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: ChangeMyPasswordDto,
  ): Promise<void> {
    return this.usersService.changePassword(currentUser.id, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  deleteAccount(@CurrentUser() currentUser: AuthenticatedUser): Promise<void> {
    return this.usersService.deleteOwnAccount(currentUser.id);
  }
}
