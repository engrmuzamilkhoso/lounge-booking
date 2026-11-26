import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { getRecordOrNotFound, idParam } from '@/lib/admin/queries';
import type { AdminPermission, AdminRole } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';
import { permissionOptions } from '../../permission-options';
import { RoleForm } from '../../role-form';

export const metadata: Metadata = { title: 'Edit role' };

export default async function EditRolePage({ params }: PageProps<'/admin/roles/[id]/edit'>) {
  const { permissions } = await getAdminAccess('/admin/roles');
  if (!permissions.has('role_edit') || !permissions.has('permission_access')) {
    return <AccessDenied />;
  }
  const { id } = await params;
  const [role, allPermissions] = await Promise.all([
    getRecordOrNotFound<AdminRole>(`/admin/roles/${idParam(id)}`),
    apiRequest<AdminPermission[]>('/admin/permissions'),
  ]);
  return (
    <>
      <PageHeader
        title={`Edit ${role.title ?? 'role'}`}
        back={{ href: '/admin/roles', label: 'Roles' }}
      />
      <RoleForm
        id={role.id}
        initialValues={{
          title: role.title ?? '',
          permissionIds: role.permissions.map((permission) => String(permission.id)),
        }}
        permissions={permissionOptions(allPermissions)}
      />
    </>
  );
}
