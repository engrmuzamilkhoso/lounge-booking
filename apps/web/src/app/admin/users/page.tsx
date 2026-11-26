import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { AccessDenied } from '@/components/admin/access-denied';
import { DataTable } from '@/components/admin/data-table';
import { FilterBar } from '@/components/admin/filter-bar';
import { Notice } from '@/components/admin/notice';
import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { RowActions } from '@/components/admin/row-actions';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { getAdminAccess, resourcePermissions } from '@/lib/admin/access';
import { pageParam, searchParam } from '@/lib/admin/queries';
import type { AdminRole, AdminUser } from '@/lib/admin/types';
import { apiRequest, apiRequestPage, toQueryString } from '@/lib/api/server-api';
import { displayName } from '@/lib/auth/current-user';

export const metadata: Metadata = { title: 'Users' };

const PAGE_SIZE = 20;

export default async function AdminUsersPage({ searchParams }: PageProps<'/admin/users'>) {
  const { user: currentUser, permissions } = await getAdminAccess('/admin/users');
  const can = resourcePermissions(permissions, 'user');
  if (!can.canList) {
    return <AccessDenied />;
  }

  const params = await searchParams;
  const search = searchParam(params.search);
  const roleParam = searchParam(params.roleId);
  const roleId = roleParam !== undefined && /^\d+$/.test(roleParam) ? roleParam : undefined;
  const page = pageParam(params.page);

  const [users, roles] = await Promise.all([
    apiRequestPage<AdminUser>(
      `/admin/users${toQueryString({ page, pageSize: PAGE_SIZE, search, roleId })}`,
    ),
    permissions.has('role_access') ? apiRequest<AdminRole[]>('/admin/roles') : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        title="Users"
        description="Customers and staff accounts. A user's roles decide what they can do in this panel."
        actions={
          can.canCreate ? (
            <ButtonLink href="/admin/users/new" icon={<Plus aria-hidden className="size-4" />}>
              Add user
            </ButtonLink>
          ) : undefined
        }
      />
      <Notice notice={params.notice} />
      <FilterBar search={search} searchPlaceholder="Name, email, phone or CNIC">
        {roles.length > 0 && (
          <div>
            <label htmlFor="filter-role" className="mb-1 block text-xs text-stone-500">
              Role
            </label>
            <Select id="filter-role" name="roleId" defaultValue={roleId ?? ''}>
              <option value="">All roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </Select>
          </div>
        )}
      </FilterBar>

      <DataTable
        rows={users.items}
        rowKey={(user) => user.id}
        emptyMessage="No users match these filters."
        columns={[
          {
            header: 'User',
            cell: (user) => (
              <span className="flex items-center gap-3">
                {user.avatarUrl === null ? (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-50 text-xs font-semibold text-gold-700">
                    {displayName(user).slice(0, 1).toUpperCase()}
                  </span>
                ) : (
                  <Image
                    src={user.avatarUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="size-8 shrink-0 rounded-full object-cover"
                  />
                )}
                <span>
                  <span className="font-medium">{displayName(user)}</span>
                  <span className="block text-xs text-stone-500">{user.email}</span>
                </span>
              </span>
            ),
          },
          {
            header: 'Phone',
            className: 'hidden md:table-cell',
            cell: (user) => user.contact ?? '—',
          },
          {
            header: 'Roles',
            className: 'hidden sm:table-cell',
            cell: (user) => (
              <span className="flex flex-wrap gap-1">
                {user.roles.map((role) => (
                  <Badge key={role.id} tone={role.title === 'Customer' ? 'neutral' : 'gold'}>
                    {role.title}
                  </Badge>
                ))}
              </span>
            ),
          },
          {
            header: 'Actions',
            className: 'w-32 text-right',
            cell: (user) => (
              <RowActions
                resource="users"
                id={user.id}
                label={`user ${user.email}`}
                editHref={can.canEdit ? `/admin/users/${user.id}/edit` : undefined}
                // Staff cannot delete their own account from here.
                canDelete={can.canDelete && user.id !== currentUser.id}
              />
            ),
          },
        ]}
      />
      <Pagination meta={users.meta} basePath="/admin/users" params={{ search, roleId }} />
    </>
  );
}
