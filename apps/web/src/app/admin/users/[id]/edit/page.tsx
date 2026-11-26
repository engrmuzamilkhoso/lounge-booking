import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { getRecordOrNotFound, idParam } from '@/lib/admin/queries';
import type { AdminRole, AdminUser } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';
import { displayName } from '@/lib/auth/current-user';
import { EditUserForm } from '../../user-form';

export const metadata: Metadata = { title: 'Edit user' };

export default async function EditUserPage({ params }: PageProps<'/admin/users/[id]/edit'>) {
  const { permissions } = await getAdminAccess('/admin/users');
  if (!permissions.has('user_edit') || !permissions.has('role_access')) {
    return <AccessDenied />;
  }
  const { id } = await params;
  const [user, roles] = await Promise.all([
    getRecordOrNotFound<AdminUser>(`/admin/users/${idParam(id)}`),
    apiRequest<AdminRole[]>('/admin/roles'),
  ]);
  return (
    <>
      <PageHeader
        title={`Edit ${displayName(user)}`}
        back={{ href: '/admin/users', label: 'Users' }}
      />
      <EditUserForm
        userId={user.id}
        initialValues={{
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          email: user.email,
          password: '',
          cnic: user.cnic ?? '',
          contact: user.contact ?? '',
          roleIds: user.roles.map((role) => String(role.id)),
        }}
        roles={roles.map((role) => ({
          value: String(role.id),
          label: role.title ?? `Role ${role.id}`,
        }))}
      />
    </>
  );
}
