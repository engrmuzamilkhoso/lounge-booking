import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { DataTable } from '@/components/admin/data-table';
import { Notice } from '@/components/admin/notice';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { ButtonLink } from '@/components/ui/button';
import { getAdminAccess, resourcePermissions } from '@/lib/admin/access';
import type { AdminMembershipType } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';
import { formatRupees } from '@/lib/format';

export const metadata: Metadata = { title: 'Membership types' };

export default async function AdminMembershipTypesPage({
  searchParams,
}: PageProps<'/admin/membership-types'>) {
  const { permissions } = await getAdminAccess('/admin/membership-types');
  const can = resourcePermissions(permissions, 'membership_type');
  if (!can.canList) {
    return <AccessDenied />;
  }
  const { notice } = await searchParams;
  const types = await apiRequest<AdminMembershipType[]>('/admin/membership-types');

  return (
    <>
      <PageHeader
        title="Membership types"
        description="Plans shown on the membership page, each with two prices."
        actions={
          can.canCreate ? (
            <ButtonLink
              href="/admin/membership-types/new"
              icon={<Plus aria-hidden className="size-4" />}
            >
              Add membership type
            </ButtonLink>
          ) : undefined
        }
      />
      <Notice notice={notice} />
      <DataTable
        rows={types}
        rowKey={(type) => type.id}
        emptyMessage="No membership types yet."
        columns={[
          { header: 'Name', cell: (type) => type.name, className: 'font-medium' },
          {
            header: 'First price',
            cell: (type) => `${formatRupees(type.price1)} · ${type.price1Text}`,
          },
          {
            header: 'Second price',
            className: 'hidden md:table-cell',
            cell: (type) => `${formatRupees(type.price2)} · ${type.price2Text}`,
          },
          {
            header: 'Actions',
            className: 'w-32 text-right',
            cell: (type) => (
              <RowActions
                resource="membershipTypes"
                id={type.id}
                label={`membership type ${type.name}`}
                editHref={can.canEdit ? `/admin/membership-types/${type.id}/edit` : undefined}
                canDelete={can.canDelete}
              />
            ),
          },
        ]}
      />
    </>
  );
}
