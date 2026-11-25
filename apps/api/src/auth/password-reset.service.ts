import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseCode } from '@booking/shared-types';
import { AppException } from '../common/http/app.exception.js';
import type { Environment } from '../config/environment.js';
import { renderOtpEmail, renderPasswordResetLinkEmail } from '../mail/templates/auth-emails.js';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { generateNumericOtp, generateOpaqueToken, hashOpaqueToken } from './crypto/opaque-token.js';
import { hashPassword, verifyPassword } from './crypto/password-hasher.js';
import type { ResetTokenResponse } from './dto/auth.dto.js';
import { TokenService } from './token.service.js';

/** Laravel used a 4-digit OTP valid for 5 minutes; kept so the app flow is unchanged. */
const OTP_DIGITS = 4;
const OTP_TTL_MINUTES = 5;
/** Wrong guesses allowed per OTP before a new one must be requested. */
const MAX_OTP_ATTEMPTS = 5;
/** How long the token returned by OTP verification can be used to set a new password. */
const OTP_RESET_TOKEN_TTL_MINUTES = 15;
/** Laravel's default password-reset link lifetime. */
const EMAIL_LINK_TTL_MINUTES = 60;

const MILLISECONDS_PER_MINUTE = 60 * 1000;

/**
 * Password reset for both clients, ending in the same single-use reset token:
 * - App: request OTP → verify OTP (returns reset token) → reset password.
 * - Website: request link (token emailed in a URL) → reset password.
 *
 * Request endpoints respond the same way whether or not the email exists, so they cannot be
 * used to discover which emails have accounts.
 */
@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly webUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    configService: ConfigService<Environment, true>,
  ) {
    this.webUrl = configService.get('WEB_URL', { infer: true });
  }

  async requestOtp(email: string): Promise<void> {
    const user = await this.findActiveUserByEmail(email);
    if (user === null) {
      this.logger.log('OTP requested for an unknown email');
      return;
    }

    const otp = generateNumericOtp(OTP_DIGITS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpHash: await hashPassword(otp),
        otpExpiresAt: minutesFromNow(OTP_TTL_MINUTES),
        otpAttempts: 0,
      },
    });

    await this.mailService.send([user.email], renderOtpEmail(otp, OTP_TTL_MINUTES));
  }

  async verifyOtp(email: string, otp: string): Promise<ResetTokenResponse> {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null },
      select: { id: true, otpHash: true, otpExpiresAt: true, otpAttempts: true },
    });

    // An unknown email gets the same answer as a wrong code.
    if (user === null || user.otpHash === null || user.otpExpiresAt === null) {
      throw new AppException(ResponseCode.InvalidOtp, HttpStatus.BAD_REQUEST);
    }
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      throw new AppException(ResponseCode.TooManyAttempts, HttpStatus.TOO_MANY_REQUESTS);
    }
    if (user.otpExpiresAt.getTime() <= Date.now()) {
      throw new AppException(ResponseCode.OtpExpired, HttpStatus.BAD_REQUEST);
    }

    const isOtpCorrect = await verifyPassword(otp, user.otpHash);
    if (!isOtpCorrect) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: { increment: 1 } },
      });
      throw new AppException(ResponseCode.InvalidOtp, HttpStatus.BAD_REQUEST);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0 },
    });

    const resetToken = await this.createResetToken(user.id, OTP_RESET_TOKEN_TTL_MINUTES);
    return { resetToken, expiresIn: OTP_RESET_TOKEN_TTL_MINUTES * 60 };
  }

  async requestResetLink(email: string): Promise<void> {
    const user = await this.findActiveUserByEmail(email);
    if (user === null) {
      this.logger.log('Password reset link requested for an unknown email');
      return;
    }

    const resetToken = await this.createResetToken(user.id, EMAIL_LINK_TTL_MINUTES);
    const resetUrl = `${this.webUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    await this.mailService.send(
      [user.email],
      renderPasswordResetLinkEmail(resetUrl, EMAIL_LINK_TTL_MINUTES),
    );
  }

  /** Sets the new password, consumes the reset token and signs out every session. */
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    const storedToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashOpaqueToken(resetToken) },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });

    const isUsable =
      storedToken !== null &&
      storedToken.usedAt === null &&
      storedToken.expiresAt.getTime() > Date.now();
    if (!isUsable) {
      throw new AppException(ResponseCode.InvalidResetToken, HttpStatus.BAD_REQUEST);
    }

    const newPasswordHash = await hashPassword(newPassword);
    await this.prisma.$transaction(async (transaction) => {
      // Conditional update so the same token cannot be used twice concurrently.
      const consumed = await transaction.passwordResetToken.updateMany({
        where: { id: storedToken.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (consumed.count === 0) {
        throw new AppException(ResponseCode.InvalidResetToken, HttpStatus.BAD_REQUEST);
      }
      await transaction.user.update({
        where: { id: storedToken.userId },
        data: { password: newPasswordHash },
      });
    });

    await this.tokenService.revokeAllForUser(storedToken.userId);
  }

  private findActiveUserByEmail(email: string): Promise<{ id: number; email: string } | null> {
    return this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null },
      select: { id: true, email: true },
    });
  }

  private async createResetToken(userId: number, ttlMinutes: number): Promise<string> {
    const resetToken = generateOpaqueToken();
    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashOpaqueToken(resetToken),
        expiresAt: minutesFromNow(ttlMinutes),
      },
    });
    return resetToken;
  }
}

function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * MILLISECONDS_PER_MINUTE);
}
