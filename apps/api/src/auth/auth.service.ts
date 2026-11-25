import { HttpStatus, Injectable } from '@nestjs/common';
import { ResponseCode, RoleId } from '@booking/shared-types';
import { AppException } from '../common/http/app.exception.js';
import { renderWelcomeEmail } from '../mail/templates/auth-emails.js';
import { MailService } from '../mail/mail.service.js';
import { isUniqueConstraintViolation } from '../prisma/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toUserProfile, type UserProfile, userProfileSelect } from '../users/user-profile.js';
import { UsersService } from '../users/users.service.js';
import { hashPassword, verifyPasswordOrDummy } from './crypto/password-hasher.js';
import type { AuthSession, LoginDto, RegisterDto } from './dto/auth.dto.js';
import { type TokenPair, TokenService } from './token.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  async login(dto: LoginDto, userAgent: string | undefined): Promise<AuthSession> {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: dto.email, mode: 'insensitive' }, deletedAt: null },
      select: { ...userProfileSelect, password: true },
    });

    const isPasswordCorrect = await verifyPasswordOrDummy(dto.password, user?.password ?? null);
    if (user === null || !isPasswordCorrect) {
      throw new AppException(ResponseCode.InvalidCredentials, HttpStatus.UNAUTHORIZED);
    }

    const tokens = await this.tokenService.issueTokenPair(user.id, userAgent);
    return { user: toUserProfile(user), ...tokens };
  }

  /** Customer self-registration: same fields, Customer role and staff email as Laravel. */
  async register(dto: RegisterDto, userAgent: string | undefined): Promise<AuthSession> {
    await this.usersService.assertEmailAvailable(dto.email);
    await this.assertCnicAvailable(dto.cnic);

    const user = await this.createCustomer(dto);
    await this.mailService.sendToStaff(renderWelcomeEmail(`${dto.firstName} ${dto.lastName}`));

    const tokens = await this.tokenService.issueTokenPair(user.id, userAgent);
    return { user, ...tokens };
  }

  refresh(refreshToken: string, userAgent: string | undefined): Promise<TokenPair> {
    return this.tokenService.rotateRefreshToken(refreshToken, userAgent);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }

  async logoutEverywhere(userId: number): Promise<void> {
    await this.tokenService.revokeAllForUser(userId);
  }

  private async createCustomer(dto: RegisterDto): Promise<UserProfile> {
    try {
      const user = await this.prisma.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          password: await hashPassword(dto.password),
          cnic: dto.cnic,
          contact: dto.contact,
          roles: { create: { roleId: RoleId.Customer } },
        },
        select: userProfileSelect,
      });
      return toUserProfile(user);
    } catch (error) {
      // Another request registered the same email between the check and the insert.
      if (isUniqueConstraintViolation(error)) {
        throw new AppException(ResponseCode.UserExists, HttpStatus.CONFLICT, {
          email: ['The email has already been taken'],
        });
      }
      throw error;
    }
  }

  /** Laravel's mobile `register` required a CNIC not used by any other account. */
  private async assertCnicAvailable(cnic: string): Promise<void> {
    const existingUser = await this.prisma.user.findFirst({
      where: { cnic },
      select: { id: true },
    });
    if (existingUser !== null) {
      throw new AppException(ResponseCode.UserExists, HttpStatus.CONFLICT, {
        cnic: ['The cnic has already been taken'],
      });
    }
  }
}
