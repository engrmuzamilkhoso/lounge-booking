import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH_REGISTRATION,
} from '../../users/password-rules.js';
import type { UserProfile } from '../../users/user-profile.js';
import type { TokenPair } from '../token.service.js';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

/** Same fields and rules as Laravel's mobile `register` endpoint. */
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH_REGISTRATION)
  @MaxLength(MAX_PASSWORD_LENGTH)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  cnic: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  contact: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class EmailDto {
  @IsEmail()
  email: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\d{4}$/, { message: 'otp must be a 4-digit code' })
  otp: string;
}

export class ResetPasswordDto {
  /** From `POST /auth/otp/verify` (app) or the emailed reset link (website). */
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH_REGISTRATION)
  @MaxLength(MAX_PASSWORD_LENGTH)
  password: string;
}

export interface AuthSession extends TokenPair {
  user: UserProfile;
}

export interface ResetTokenResponse {
  resetToken: string;
  /** Seconds until the reset token expires. */
  expiresIn: number;
}
