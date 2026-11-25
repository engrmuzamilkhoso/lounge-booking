import type { Request } from 'express';

/** The caller of an authenticated request, attached to the request by JwtAuthGuard. */
export interface AuthenticatedUser {
  id: number;
  email: string;
  roleIds: number[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
