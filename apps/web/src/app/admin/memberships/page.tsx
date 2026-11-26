import { MembershipStatus } from '@booking/shared-types';
import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AccessDenied } from '@/components/admin/access-denied';
import { DataTable } from '@/components/admin/data-table';
import { FilterBar } from '@/components/admin/filter-bar';
import { Notice } from '@/components/admin/notice';
import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { RowActions } from '@/components/admin/row-actions';
import { MembershipStatusBadge } from '@/components/admin/membership-status-badge';
import { ButtonLink } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { getAdminAccess, resourcePermissions } from '@/lib/admin/access';
import { pageParam, searchParam } from '@/lib/admin/queries';
import type { AdminMembership } from '@/lib/admin/types';
import { apiRequestPage, toQueryString } from '@/lib/api/server-api';

export const metadata: Metadata = { title: 'Memberships' };

const PAGE_SIZE = 20;

export default async function AdminMembershipsPage({
  searchParams,
}: PageProps<'/admin/memberships'>) {
  const { permissions } = await getAdminAccess('/admin/memberships');
  const can = resourcePermissions(permissions, 'membership');
  if (!can.canList) {
    return <AccessDenied />;
  }

  const params = await searchParams;
  const search = searchParam(params.search);
  const statusParam = searchParam(params.status);
  const status =
    statusParam === String(MembershipStatus.Pending) ||
    statusParam === String(MembershipStatus.Approved)
      ? statusParam
      : undefined;
  const page = pageParam(params.page);

  const memberships = await apiRequestPage<AdminMembership>(
    `/admin/memberships${toQueryString({ page, pageSize: PAGE_SIZE, search, status })}`,
  );

  return (
    <>
      <PageHeader
        title="Memberships"
        description="Applications and approved members. Approve an application to issue its serial number."
        actions={
          can.canCreate ? (
            <ButtonLink
              href="/admin/memberships/new"
              icon={<Plus aria-hidden className="size-4" />}
            >
              Add membership
            </ButtonLink>
          ) : undefined
        }
      />
      <Notice notice={params.notice} />
      <FilterBar search={search} searchPlaceholder="Name, email, phone or serial number">
        <div>
          <label htmlFor="filter-status" className="mb-1 block text-xs text-stone-500">
            Status
          </label>
          <Select id="filter-status" name="status" defaultValue={status ?? ''}>
            <option value="">All</option>
            <option value={MembershipStatus.Pending}>Awaiting approval</option>
            <option value={MembershipStatus.Approved}>Approved</option>
          </Select>
        </div>
      </FilterBar>

      <DataTable
        rows={memberships.items}
        rowKey={(membership) => membership.id}
        emptyMessage="No memberships match these filters."
        columns={[
          {
            header: 'Member',
            cell: (membership) => (
              <span>
                {can.canShow ? (
                  <Link
                    href={`/admin/memberships/${membership.id}`}
                    className="font-medium text-gold-600 hover:underline"
                  >
                    {membership.name}
                  </Link>
                ) : (
                  <span className="font-medium">{membership.name}</span>
                )}
                <span className="block text-xs text-stone-500">{membership.email}</span>
              </span>
            ),
          },
          {
            header: 'Type',
            className: 'hidden md:table-cell',
            cell: (membership) => membership.membershipType?.name ?? '—',
          },
          {
            header: 'Serial no.',
            className: 'hidden md:table-cell font-mono text-xs',
            cell: (membership) => membership.serialNo ?? '—',
          },
          {
            header: 'Visits',
            className: 'hidden lg:table-cell',
            cell: (membership) =>
              membership.visitLimit === null
                ? '—'
                : `${membership.usedVisits} of ${membership.visitLimit}`,
          },
          {
            header: 'Status',
            cell: (membership) => <MembershipStatusBadge status={membership.status} />,
          },
          {
            header: 'Actions',
            className: 'w-32 text-right',
            cell: (membership) => (
              <RowActions
                resource="memberships"
                id={membership.id}
                label={`membership of ${membership.name}`}
                viewHref={can.canShow ? `/admin/memberships/${membership.id}` : undefined}
                editHref={can.canEdit ? `/admin/memberships/${membership.id}/edit` : undefined}
                canDelete={can.canDelete}
              />
            ),
          },
        ]}
      />
      <Pagination
        meta={memberships.meta}
        basePath="/admin/memberships"
        params={{ search, status }}
      />
    </>
  );
}
