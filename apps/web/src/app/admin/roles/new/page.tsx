import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import type { AdminPermission } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';
import { permissionOptions } from '../permission-options';
import { RoleForm } from '../role-form';

export const metadata: Metadata = { title: 'Add role' };

export default async function NewRolePage() {
  const { permissions } = await getAdminAccess('/admin/roles');
  if (!permissions.has('role_create') || !permissions.has('permission_access')) {
    return <AccessDenied />;
  }
  const allPermissions = await apiRequest<AdminPermission[]>('/admin/permissions');
  return (
    <>
      <PageHeader title="Add role" back={{ href: '/admin/roles', label: 'Roles' }} />
      <RoleForm
        id={null}
        initialValues={{ title: '', permissionIds: [] }}
        permissions={permissionOptions(allPermissions)}
      />
    </>
  );
}
