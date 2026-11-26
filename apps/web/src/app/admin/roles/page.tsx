import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { DataTable } from '@/components/admin/data-table';
import { Notice } from '@/components/admin/notice';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { ButtonLink } from '@/components/ui/button';
import { getAdminAccess, resourcePermissions } from '@/lib/admin/access';
import type { AdminRole } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';

export const metadata: Metadata = { title: 'Roles' };

export default async function AdminRolesPage({ searchParams }: PageProps<'/admin/roles'>) {
  const { permissions } = await getAdminAccess('/admin/roles');
  const can = resourcePermissions(permissions, 'role');
  if (!can.canList) {
    return <AccessDenied />;
  }
  const { notice } = await searchParams;
  const roles = await apiRequest<AdminRole[]>('/admin/roles');

  return (
    <>
      <PageHeader
        title="Roles"
        description="A role is a named set of permissions, given to users."
        actions={
          can.canCreate ? (
            <ButtonLink href="/admin/roles/new" icon={<Plus aria-hidden className="size-4" />}>
              Add role
            </ButtonLink>
          ) : undefined
        }
      />
      <Notice notice={notice} />
      <DataTable
        rows={roles}
        rowKey={(role) => role.id}
        emptyMessage="No roles yet."
        columns={[
          { header: 'ID', cell: (role) => role.id, className: 'w-20 text-stone-500' },
          { header: 'Role', cell: (role) => role.title ?? '—', className: 'font-medium' },
          {
            header: 'Permissions',
            cell: (role) => `${role.permissions.length} permission(s)`,
            className: 'text-stone-600',
          },
          {
            header: 'Actions',
            className: 'w-32 text-right',
            cell: (role) => (
              <RowActions
                resource="roles"
                id={role.id}
                label={`role ${role.title ?? role.id}`}
                editHref={can.canEdit ? `/admin/roles/${role.id}/edit` : undefined}
                canDelete={can.canDelete}
              />
            ),
          },
        ]}
      />
    </>
  );
}
