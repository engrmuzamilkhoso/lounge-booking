import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ResponseCode } from '@booking/shared-types';
import { AppException } from '../../common/http/app.exception.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthenticatedRequest } from '../authenticated-user.js';
import { IS_PUBLIC_ROUTE } from '../decorators/public.decorator.js';
import type { AccessTokenPayload } from '../token.service.js';

/**
 * Registered globally. Requires `Authorization: Bearer <accessToken>` on every route that is
 * not marked @Public(), and attaches the caller to `request.user`.
 *
 * The user is re-loaded on each request so that a deleted account loses access immediately,
 * rather than when its access token expires.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic === true) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = this.extractBearerToken(request.headers.authorization);
    if (accessToken === null) {
      throw new AppException(ResponseCode.Unauthorized, HttpStatus.UNAUTHORIZED);
    }

    const payload = await this.verifyAccessToken(accessToken);

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: { id: true, email: true, roles: { select: { roleId: true } } },
    });
    if (user === null) {
      throw new AppException(ResponseCode.Unauthorized, HttpStatus.UNAUTHORIZED);
    }

    request.user = {
      id: user.id,
      email: user.email,
      roleIds: user.roles.map((roleUser) => roleUser.roleId),
    };
    return true;
  }

  private extractBearerToken(authorizationHeader: string | undefined): string | null {
    if (authorizationHeader === undefined) {
      return null;
    }
    const [scheme, token] = authorizationHeader.split(' ');
    if (scheme !== 'Bearer' || token === undefined || token === '') {
      return null;
    }
    return token;
  }

  private async verifyAccessToken(accessToken: string): Promise<AccessTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(accessToken);
    } catch {
      throw new AppException(ResponseCode.Unauthorized, HttpStatus.UNAUTHORIZED);
    }
  }
}
