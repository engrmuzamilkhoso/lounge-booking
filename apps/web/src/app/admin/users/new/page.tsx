import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import type { AdminRole } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';
import { CreateUserForm } from '../user-form';

export const metadata: Metadata = { title: 'Add user' };

export default async function NewUserPage() {
  const { permissions } = await getAdminAccess('/admin/users');
  // Assigning roles needs the role list, so both permissions are required.
  if (!permissions.has('user_create') || !permissions.has('role_access')) {
    return <AccessDenied />;
  }
  const roles = await apiRequest<AdminRole[]>('/admin/roles');
  return (
    <>
      <PageHeader title="Add user" back={{ href: '/admin/users', label: 'Users' }} />
      <CreateUserForm
        roles={roles.map((role) => ({
          value: String(role.id),
          label: role.title ?? `Role ${role.id}`,
        }))}
      />
    </>
  );
}
