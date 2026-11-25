import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthenticatedUser } from './authenticated-user.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import type { AuthSession, ResetTokenResponse } from './dto/auth.dto.js';
import {
  EmailDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/auth.dto.js';
import { PasswordResetService } from './password-reset.service.js';
import type { TokenPair } from './token.service.js';
import { UsersService } from '../users/users.service.js';

/** Stricter per-IP limits for endpoints attackers would brute-force or use to send email. */
const CREDENTIAL_LIMIT = { default: { limit: 10, ttl: 60_000 } };
const EMAIL_SENDING_LIMIT = { default: { limit: 5, ttl: 60_000 } };

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Throttle(CREDENTIAL_LIMIT)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<AuthSession> {
    return this.authService.login(dto, userAgent);
  }

  @Public()
  @Throttle(EMAIL_SENDING_LIMIT)
  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<AuthSession> {
    return this.authService.register(dto, userAgent);
  }

  /** Signup form check (Laravel `check_email_exist`). */
  @Public()
  @Throttle(CREDENTIAL_LIMIT)
  @Get('email-available')
  async isEmailAvailable(@Query() query: EmailDto): Promise<{ available: boolean }> {
    const available = await this.usersService.isEmailAvailable(query.email);
    return { available };
  }

  /** Exchanges a refresh token for a new token pair. The old refresh token stops working. */
  @Public()
  @Throttle(CREDENTIAL_LIMIT)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @Body() dto: RefreshTokenDto,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<TokenPair> {
    return this.authService.refresh(dto.refreshToken, userAgent);
  }

  /** Ends this device's session. */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: RefreshTokenDto): Promise<void> {
    return this.authService.logout(dto.refreshToken);
  }

  /** Ends every session of the current user (Laravel's mobile logout behaviour). */
  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  logoutEverywhere(@CurrentUser() currentUser: AuthenticatedUser): Promise<void> {
    return this.authService.logoutEverywhere(currentUser.id);
  }

  /** App password reset, step 1: email a 4-digit code (valid 5 minutes). */
  @Public()
  @Throttle(EMAIL_SENDING_LIMIT)
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  requestOtp(@Body() dto: EmailDto): Promise<void> {
    return this.passwordResetService.requestOtp(dto.email);
  }

  /** App password reset, step 2: exchange the code for a single-use reset token. */
  @Public()
  @Throttle(CREDENTIAL_LIMIT)
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto): Promise<ResetTokenResponse> {
    return this.passwordResetService.verifyOtp(dto.email, dto.otp);
  }

  /** Website password reset, step 1: email a reset link. */
  @Public()
  @Throttle(EMAIL_SENDING_LIMIT)
  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: EmailDto): Promise<void> {
    return this.passwordResetService.requestResetLink(dto.email);
  }

  /** Final step for both app and website. Signs out all existing sessions. */
  @Public()
  @Throttle(CREDENTIAL_LIMIT)
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    return this.passwordResetService.resetPassword(dto.resetToken, dto.password);
  }
}
