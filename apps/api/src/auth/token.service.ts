import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ResponseCode } from '@booking/shared-types';
import { AppException } from '../common/http/app.exception.js';
import type { Environment } from '../config/environment.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { generateOpaqueToken, hashOpaqueToken } from './crypto/opaque-token.js';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const CONCURRENT_REFRESH_GRACE_MS = 30 * 1000;

export interface TokenPair {
  accessToken: string;
  /** Seconds until the access token expires. */
  accessTokenExpiresIn: number;
  refreshToken: string;
}

export interface AccessTokenPayload {
  sub: number;
}

/**
 * Short-lived JWT access tokens plus long-lived opaque refresh tokens.
 *
 * Refresh tokens rotate: each use revokes the presented token and issues a new pair.
 * Presenting an already-revoked token means it was copied and used elsewhere, so every
 * session of that user is revoked.
 */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly accessTokenTtlSeconds: number;
  private readonly refreshTokenTtlDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    configService: ConfigService<Environment, true>,
  ) {
    this.accessTokenTtlSeconds = configService.get('JWT_ACCESS_TTL_SECONDS', { infer: true });
    this.refreshTokenTtlDays = configService.get('REFRESH_TOKEN_TTL_DAYS', { infer: true });
  }

  async issueTokenPair(userId: number, userAgent: string | undefined): Promise<TokenPair> {
    const payload: AccessTokenPayload = { sub: userId };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.accessTokenTtlSeconds,
    });

    const refreshToken = generateOpaqueToken();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashOpaqueToken(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshTokenTtlDays * MILLISECONDS_PER_DAY),
        userAgent: userAgent?.slice(0, 255),
      },
    });

    return { accessToken, accessTokenExpiresIn: this.accessTokenTtlSeconds, refreshToken };
  }

  async rotateRefreshToken(
    refreshToken: string,
    userAgent: string | undefined,
  ): Promise<TokenPair> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashOpaqueToken(refreshToken) },
      include: { user: { select: { deletedAt: true } } },
    });

    if (storedToken === null) {
      throw new AppException(ResponseCode.Unauthorized, HttpStatus.UNAUTHORIZED);
    }

    if (storedToken.revokedAt !== null) {
      // A browser can send several requests at once right after its access token expires;
      // they all present the same refresh token and only the first can rotate it. Reuse within
      // the grace period is that race, not theft, so other sessions are left alone.
      const millisecondsSinceRevoked = Date.now() - storedToken.revokedAt.getTime();
      const isConcurrentRefresh = millisecondsSinceRevoked < CONCURRENT_REFRESH_GRACE_MS;
      if (!isConcurrentRefresh) {
        this.logger.warn({ userId: storedToken.userId }, 'Revoked refresh token reused');
        await this.revokeAllForUser(storedToken.userId);
      }
      throw new AppException(ResponseCode.Unauthorized, HttpStatus.UNAUTHORIZED);
    }

    const isExpired = storedToken.expiresAt.getTime() <= Date.now();
    const isUserDeleted = storedToken.user.deletedAt !== null;
    if (isExpired || isUserDeleted) {
      throw new AppException(ResponseCode.Unauthorized, HttpStatus.UNAUTHORIZED);
    }

    // Conditional update: if two requests race with the same token, only one wins.
    const revocation = await this.prisma.refreshToken.updateMany({
      where: { id: storedToken.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (revocation.count === 0) {
      throw new AppException(ResponseCode.Unauthorized, HttpStatus.UNAUTHORIZED);
    }

    return this.issueTokenPair(storedToken.userId, userAgent);
  }

  /** Revokes one refresh token. Unknown or already-revoked tokens are ignored. */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashOpaqueToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
