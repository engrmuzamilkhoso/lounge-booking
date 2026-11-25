import { HttpStatus, Injectable } from '@nestjs/common';
import { ResponseCode } from '@booking/shared-types';
import { hashPassword, verifyPassword } from '../auth/crypto/password-hasher.js';
import { TokenService } from '../auth/token.service.js';
import { AppException } from '../common/http/app.exception.js';
import { recordNotFound } from '../common/http/not-found.js';
import { PaginatedResult } from '../common/pagination/paginated-result.js';
import type { Prisma } from '../generated/prisma/client.js';
import { isUniqueConstraintViolation } from '../prisma/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateUserDto, ListUsersQueryDto, UpdateUserDto } from './dto/admin-user.dto.js';
import type { ChangeMyPasswordDto, UpdateMyProfileDto } from './dto/me.dto.js';
import { toUserProfile, type UserProfile, userProfileSelect } from './user-profile.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  // ───────────────────────────── Current user ─────────────────────────────

  async getProfile(userId: number): Promise<UserProfile> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: userProfileSelect,
    });
    if (user === null) {
      throw recordNotFound();
    }
    return toUserProfile(user);
  }

  async updateProfile(userId: number, dto: UpdateMyProfileDto): Promise<UserProfile> {
    if (dto.email !== undefined) {
      await this.assertEmailAvailable(dto.email, userId);
    }

    const user = await this.saveUser(() =>
      this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          contact: dto.contact,
        },
        select: userProfileSelect,
      }),
    );
    return toUserProfile(user);
  }

  /** Changing the password signs out every other session. */
  async changePassword(userId: number, dto: ChangeMyPasswordDto): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { password: true },
    });
    if (user === null) {
      throw recordNotFound();
    }

    const isCurrentPasswordCorrect = await verifyPassword(dto.currentPassword, user.password);
    if (!isCurrentPasswordCorrect) {
      throw new AppException(ResponseCode.InvalidCredentials, HttpStatus.UNPROCESSABLE_ENTITY, {
        currentPassword: ['The current password is incorrect'],
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: await hashPassword(dto.newPassword) },
    });
    await this.tokenService.revokeAllForUser(userId);
  }

  /**
   * Same as Laravel's "delete account": the email gets a timestamp prefix so it can be
   * registered again, then the user is soft-deleted.
   */
  async deleteOwnAccount(userId: number): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { email: true },
    });
    if (user === null) {
      throw recordNotFound();
    }

    const unixSeconds = Math.floor(Date.now() / 1000);
    await this.prisma.user.update({
      where: { id: userId },
      data: { email: `${unixSeconds}_${user.email}`, deletedAt: new Date() },
    });
    await this.tokenService.revokeAllForUser(userId);
  }

  // ──────────────────────────────── Admin ─────────────────────────────────

  async list(query: ListUsersQueryDto): Promise<PaginatedResult<UserProfile>> {
    const where: Prisma.UserWhereInput = { deletedAt: null };

    if (query.search !== undefined && query.search !== '') {
      const contains = { contains: query.search, mode: 'insensitive' as const };
      where.OR = [
        { firstName: contains },
        { lastName: contains },
        { email: contains },
        { contact: contains },
        { cnic: contains },
      ];
    }
    if (query.roleId !== undefined) {
      where.roles = { some: { roleId: query.roleId } };
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: userProfileSelect,
        orderBy: { id: 'desc' },
        skip: query.skip,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return PaginatedResult.of(users.map(toUserProfile), total, query);
  }

  async create(dto: CreateUserDto): Promise<UserProfile> {
    await this.assertEmailAvailable(dto.email);
    await this.assertRolesExist(dto.roleIds);

    const user = await this.saveUser(async () =>
      this.prisma.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          password: await hashPassword(dto.password),
          cnic: dto.cnic,
          contact: dto.contact,
          roles: { create: uniqueIds(dto.roleIds).map((roleId) => ({ roleId })) },
        },
        select: userProfileSelect,
      }),
    );
    return toUserProfile(user);
  }

  async update(userId: number, dto: UpdateUserDto): Promise<UserProfile> {
    await this.getProfile(userId);
    await this.assertEmailAvailable(dto.email, userId);
    await this.assertRolesExist(dto.roleIds);

    const newPasswordHash =
      dto.password === undefined ? undefined : await hashPassword(dto.password);

    const user = await this.saveUser(() =>
      this.prisma.$transaction(async (transaction) => {
        await transaction.roleUser.deleteMany({ where: { userId } });
        return transaction.user.update({
          where: { id: userId },
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            password: newPasswordHash,
            cnic: dto.cnic,
            contact: dto.contact,
            roles: { create: uniqueIds(dto.roleIds).map((roleId) => ({ roleId })) },
          },
          select: userProfileSelect,
        });
      }),
    );

    if (newPasswordHash !== undefined) {
      await this.tokenService.revokeAllForUser(userId);
    }
    return toUserProfile(user);
  }

  /** Soft delete, as in Laravel's admin panel (the email stays reserved). */
  async softDelete(userIds: number[]): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id: { in: userIds }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    for (const userId of userIds) {
      await this.tokenService.revokeAllForUser(userId);
    }
  }

  // ─────────────────────────────── Helpers ────────────────────────────────

  /**
   * Emails are unique regardless of letter case and including deleted accounts
   * (Laravel's `unique:users` rule and the database index behave the same way).
   */
  async isEmailAvailable(email: string, exceptUserId?: number): Promise<boolean> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        id: exceptUserId === undefined ? undefined : { not: exceptUserId },
      },
      select: { id: true },
    });
    return existingUser === null;
  }

  async assertEmailAvailable(email: string, exceptUserId?: number): Promise<void> {
    const isAvailable = await this.isEmailAvailable(email, exceptUserId);
    if (!isAvailable) {
      throw emailTaken();
    }
  }

  private async assertRolesExist(roleIds: number[]): Promise<void> {
    const ids = uniqueIds(roleIds);
    const existingCount = await this.prisma.role.count({
      where: { id: { in: ids }, deletedAt: null },
    });
    if (existingCount !== ids.length) {
      throw new AppException(ResponseCode.InvalidData, HttpStatus.UNPROCESSABLE_ENTITY, {
        roleIds: ['One or more roles do not exist'],
      });
    }
  }

  /** Runs a write and turns a duplicate-email race into the same error as the pre-check. */
  private async saveUser<TResult>(write: () => Promise<TResult>): Promise<TResult> {
    try {
      return await write();
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw emailTaken();
      }
      throw error;
    }
  }
}

function emailTaken(): AppException {
  return new AppException(ResponseCode.UserExists, HttpStatus.CONFLICT, {
    email: ['The email has already been taken'],
  });
}

function uniqueIds(ids: number[]): number[] {
  return [...new Set(ids)];
}
