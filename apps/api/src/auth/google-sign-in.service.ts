import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ResponseCode, RoleId } from '@booking/shared-types';
import { AppException } from '../common/http/app.exception.js';
import { renderWelcomeEmail } from '../mail/templates/auth-emails.js';
import { MailService } from '../mail/mail.service.js';
import { isUniqueConstraintViolation } from '../prisma/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toUserProfile, type UserProfile, userProfileSelect } from '../users/user-profile.js';
import { generateOpaqueToken } from './crypto/opaque-token.js';
import { hashPassword } from './crypto/password-hasher.js';
import type { AuthSession } from './dto/auth.dto.js';
import { type GoogleIdentity, GoogleIdentityService } from './google-identity.service.js';
import { TokenService } from './token.service.js';

export interface GoogleAuthSession extends AuthSession {
  /** True when this sign-in created the account (the website can then ask for missing details). */
  isNewAccount: boolean;
}

/**
 * "Sign in with Google" and "Sign up with Google".
 *
 * Account matching, in order:
 * 1. A user already linked to this Google account → signed in.
 * 2. A user with the same (Google-verified) email → the Google account is linked, then signed in.
 *    Google has proved the person controls that address, the same proof a reset email gives.
 * 3. Nobody → a Customer account is created, exactly like email registration.
 */
@Injectable()
export class GoogleSignInService {
  private readonly logger = new Logger(GoogleSignInService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleIdentityService: GoogleIdentityService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) {}

  async signIn(idToken: string, userAgent: string | undefined): Promise<GoogleAuthSession> {
    const identity = await this.googleIdentityService.verify(idToken);

    const linkedUser = await this.prisma.user.findUnique({
      where: { googleSub: identity.subject },
      select: { ...userProfileSelect, deletedAt: true },
    });
    if (linkedUser !== null) {
      if (linkedUser.deletedAt !== null) {
        throw new AppException(ResponseCode.InvalidCredentials, HttpStatus.UNAUTHORIZED);
      }
      return this.startSession(toUserProfile(linkedUser), false, userAgent);
    }

    const userWithEmail = await this.prisma.user.findFirst({
      where: { email: { equals: identity.email, mode: 'insensitive' } },
      select: { id: true, googleSub: true, deletedAt: true },
    });
    if (userWithEmail !== null) {
      const linked = await this.linkExistingUser(userWithEmail, identity);
      return this.startSession(linked, false, userAgent);
    }

    const created = await this.createCustomer(identity);
    await this.mailService.sendToStaff(
      renderWelcomeEmail(`${identity.firstName} ${identity.lastName}`.trim()),
      [identity.email],
    );
    return this.startSession(created, true, userAgent);
  }

  private async linkExistingUser(
    user: { id: number; googleSub: string | null; deletedAt: Date | null },
    identity: GoogleIdentity,
  ): Promise<UserProfile> {
    // A deleted account keeps its email reserved; it cannot be revived through Google.
    if (user.deletedAt !== null) {
      throw new AppException(ResponseCode.InvalidCredentials, HttpStatus.UNAUTHORIZED);
    }
    // Already linked to a different Google account: refuse rather than silently re-link.
    if (user.googleSub !== null && user.googleSub !== identity.subject) {
      throw new AppException(ResponseCode.UserExists, HttpStatus.CONFLICT, {
        email: ['This email is linked to a different Google account'],
      });
    }

    this.logger.log({ userId: user.id }, 'Linked Google account to existing user');
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { googleSub: identity.subject, emailVerifiedAt: new Date() },
      select: userProfileSelect,
    });
    return toUserProfile(updated);
  }

  /**
   * New Customer from a Google profile. CNIC and contact number are unknown (the profile page
   * asks for them). The password is random and unknown to anyone; the customer can set one
   * later with "Forgot password".
   */
  private async createCustomer(identity: GoogleIdentity): Promise<UserProfile> {
    try {
      const user = await this.prisma.user.create({
        data: {
          firstName: identity.firstName,
          lastName: identity.lastName,
          email: identity.email,
          password: await hashPassword(generateOpaqueToken()),
          googleSub: identity.subject,
          emailVerifiedAt: new Date(),
          roles: { create: { roleId: RoleId.Customer } },
        },
        select: userProfileSelect,
      });
      return toUserProfile(user);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new AppException(ResponseCode.UserExists, HttpStatus.CONFLICT);
      }
      throw error;
    }
  }

  private async startSession(
    user: UserProfile,
    isNewAccount: boolean,
    userAgent: string | undefined,
  ): Promise<GoogleAuthSession> {
    const tokens = await this.tokenService.issueTokenPair(user.id, userAgent);
    return { user, ...tokens, isNewAccount };
  }
}
