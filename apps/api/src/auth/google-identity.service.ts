import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { ResponseCode } from '@booking/shared-types';
import { AppException } from '../common/http/app.exception.js';
import type { Environment } from '../config/environment.js';

/** The parts of a verified Google ID token this application uses. */
export interface GoogleIdentity {
  /** Stable Google account id. */
  subject: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Profile picture URL, when the Google account has one and shares it. */
  pictureUrl: string | null;
}

/**
 * Verifies Google ID tokens (from the "Sign in with Google" button) on the server:
 * signature against Google's public keys, issuer, expiry and that the token was issued for
 * our Client ID. The browser's claim about who the user is is never trusted on its own.
 */
@Injectable()
export class GoogleIdentityService {
  private readonly logger = new Logger(GoogleIdentityService.name);
  private readonly clientId: string;
  private readonly client: OAuth2Client;

  constructor(configService: ConfigService<Environment, true>) {
    this.clientId = configService.get('GOOGLE_CLIENT_ID', { infer: true });
    this.client = new OAuth2Client();
  }

  get isEnabled(): boolean {
    return this.clientId !== '';
  }

  async verify(idToken: string): Promise<GoogleIdentity> {
    if (!this.isEnabled) {
      throw new AppException(ResponseCode.Forbidden, HttpStatus.NOT_IMPLEMENTED);
    }

    let payload;
    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience: this.clientId });
      payload = ticket.getPayload();
    } catch (error) {
      this.logger.warn({ err: error }, 'Google ID token rejected');
      throw new AppException(ResponseCode.InvalidCredentials, HttpStatus.UNAUTHORIZED);
    }

    if (payload === undefined || payload.sub === '') {
      throw new AppException(ResponseCode.InvalidCredentials, HttpStatus.UNAUTHORIZED);
    }
    // Only a Google-verified address may be matched to an existing account.
    const email = payload.email;
    if (email === undefined || payload.email_verified !== true) {
      throw new AppException(ResponseCode.InvalidCredentials, HttpStatus.UNAUTHORIZED);
    }

    return {
      subject: payload.sub,
      email,
      firstName: payload.given_name ?? payload.name ?? email,
      lastName: payload.family_name ?? '',
      pictureUrl: payload.picture ?? null,
    };
  }
}
