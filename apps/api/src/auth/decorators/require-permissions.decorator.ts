import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSIONS = 'requiredPermissions';

/**
 * Restricts a route to users whose roles grant ALL of the given permission titles.
 * Titles are the ones stored in the `permissions` table (e.g. `booking_access`, `user_edit`),
 * the same names Laravel's Gates used.
 */
export const RequirePermissions = (
  ...permissionTitles: string[]
): MethodDecorator & ClassDecorator => SetMetadata(REQUIRED_PERMISSIONS, permissionTitles);
