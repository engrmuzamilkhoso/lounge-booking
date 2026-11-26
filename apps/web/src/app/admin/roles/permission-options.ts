import type { AdminPermission } from '@/lib/admin/types';

/** Permission checkboxes for the role form, alphabetical so related keys sit together. */
export function permissionOptions(permissions: AdminPermission[]) {
  return [...permissions]
    .sort((first, second) => (first.title ?? '').localeCompare(second.title ?? ''))
    .map((permission) => ({
      value: String(permission.id),
      label: permission.title ?? `Permission ${permission.id}`,
    }));
}
