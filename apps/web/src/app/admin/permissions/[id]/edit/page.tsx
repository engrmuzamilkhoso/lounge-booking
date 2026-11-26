import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { getRecordOrNotFound, idParam } from '@/lib/admin/queries';
import type { AdminPermission } from '@/lib/admin/types';
import { PermissionForm } from '../../permission-form';

export const metadata: Metadata = { title: 'Edit permission' };

export default async function EditPermissionPage({
  params,
}: PageProps<'/admin/permissions/[id]/edit'>) {
  const { permissions } = await getAdminAccess('/admin/permissions');
  if (!permissions.has('permission_edit')) {
    return <AccessDenied />;
  }
  const { id } = await params;
  const permission = await getRecordOrNotFound<AdminPermission>(
    `/admin/permissions/${idParam(id)}`,
  );
  return (
    <>
      <PageHeader
        title={`Edit ${permission.title ?? 'permission'}`}
        back={{ href: '/admin/permissions', label: 'Permissions' }}
      />
      <PermissionForm id={permission.id} initialTitle={permission.title ?? ''} />
    </>
  );
}
