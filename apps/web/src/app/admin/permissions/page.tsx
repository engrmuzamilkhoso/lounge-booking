import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { DataTable } from '@/components/admin/data-table';
import { FilterBar } from '@/components/admin/filter-bar';
import { Notice } from '@/components/admin/notice';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { ButtonLink } from '@/components/ui/button';
import { getAdminAccess, resourcePermissions } from '@/lib/admin/access';
import { matchesSearch, searchParam } from '@/lib/admin/queries';
import type { AdminPermission } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';

export const metadata: Metadata = { title: 'Permissions' };

export default async function AdminPermissionsPage({
  searchParams,
}: PageProps<'/admin/permissions'>) {
  const { permissions } = await getAdminAccess('/admin/permissions');
  const can = resourcePermissions(permissions, 'permission');
  if (!can.canList) {
    return <AccessDenied />;
  }
  const params = await searchParams;
  const search = searchParam(params.search);
  const all = await apiRequest<AdminPermission[]>('/admin/permissions');
  const rows = all
    .filter((permission) => matchesSearch(search, permission.title))
    .sort((first, second) => (first.title ?? '').localeCompare(second.title ?? ''));

  return (
    <>
      <PageHeader
        title="Permissions"
        description="Keys the system checks, e.g. booking_edit. The application only uses the keys it knows; adding one here does not create a new feature."
        actions={
          can.canCreate ? (
            <ButtonLink
              href="/admin/permissions/new"
              icon={<Plus aria-hidden className="size-4" />}
            >
              Add permission
            </ButtonLink>
          ) : undefined
        }
      />
      <Notice notice={params.notice} />
      <FilterBar search={search} searchPlaceholder="e.g. booking" />
      <DataTable
        rows={rows}
        rowKey={(permission) => permission.id}
        emptyMessage="No permissions match."
        columns={[
          { header: 'ID', cell: (permission) => permission.id, className: 'w-20 text-stone-500' },
          {
            header: 'Key',
            cell: (permission) => permission.title ?? '—',
            className: 'font-mono text-xs',
          },
          {
            header: 'Actions',
            className: 'w-32 text-right',
            cell: (permission) => (
              <RowActions
                resource="permissions"
                id={permission.id}
                label={`permission ${permission.title ?? permission.id}`}
                editHref={can.canEdit ? `/admin/permissions/${permission.id}/edit` : undefined}
                canDelete={can.canDelete}
              />
            ),
          },
        ]}
      />
    </>
  );
}
