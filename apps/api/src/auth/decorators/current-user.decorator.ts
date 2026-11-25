import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest, AuthenticatedUser } from '../authenticated-user.js';

/** Injects the authenticated caller into a controller method parameter. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user === undefined) {
      // Only reachable if @CurrentUser is used on a @Public route — a programming error.
      throw new UnauthorizedException();
    }
    return request.user;
  },
);
