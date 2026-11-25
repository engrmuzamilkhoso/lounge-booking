import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-user.js';

/** Who performed a change, recorded in `audit_logs` (`user_id`, `host`). */
export interface AuditActor {
  userId: number | null;
  ipAddress: string | null;
}

/** Controller parameter decorator that captures the AuditActor of the current request. */
export const CurrentAuditActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuditActor => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return {
      userId: request.user?.id ?? null,
      ipAddress: request.ip ?? null,
    };
  },
);
