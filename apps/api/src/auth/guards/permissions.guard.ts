import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ResponseCode } from '@booking/shared-types';
import { AccessControlService } from '../../access-control/access-control.service.js';
import { AppException } from '../../common/http/app.exception.js';
import type { AuthenticatedRequest } from '../authenticated-user.js';
import { REQUIRED_PERMISSIONS } from '../decorators/require-permissions.decorator.js';

/**
 * Registered globally after JwtAuthGuard. Enforces @RequirePermissions using the
 * roles → permissions tables, replacing Laravel's AuthGates middleware.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessControlService: AccessControlService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[] | undefined>(
      REQUIRED_PERMISSIONS,
      [context.getHandler(), context.getClass()],
    );
    if (requiredPermissions === undefined || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user === undefined) {
      throw new AppException(ResponseCode.Unauthorized, HttpStatus.UNAUTHORIZED);
    }

    const grantedPermissions = await this.accessControlService.getPermissionTitlesForRoles(
      request.user.roleIds,
    );
    const hasAllPermissions = requiredPermissions.every((permission) =>
      grantedPermissions.has(permission),
    );
    if (!hasAllPermissions) {
      throw new AppException(ResponseCode.Forbidden, HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
