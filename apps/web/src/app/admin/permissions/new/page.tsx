import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { PermissionForm } from '../permission-form';

export const metadata: Metadata = { title: 'Add permission' };

export default async function NewPermissionPage() {
  const { permissions } = await getAdminAccess('/admin/permissions');
  if (!permissions.has('permission_create')) {
    return <AccessDenied />;
  }
  return (
    <>
      <PageHeader
        title="Add permission"
        back={{ href: '/admin/permissions', label: 'Permissions' }}
      />
      <PermissionForm id={null} initialTitle="" />
    </>
  );
}
