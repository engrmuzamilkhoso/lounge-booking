import { Plus } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { getAdminAccess, resourcePermissions } from '@/lib/admin/access';
import { type NameLookupKey, nameLookups } from '@/lib/admin/name-lookups';
import { getRecordOrNotFound, matchesSearch, searchParam } from '@/lib/admin/queries';
import type { AdminLookup } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';
import { AccessDenied } from '../access-denied';
import { DataTable } from '../data-table';
import { FilterBar } from '../filter-bar';
import { Notice } from '../notice';
import { PageHeader } from '../page-header';
import { RowActions } from '../row-actions';
import { NameLookupForm } from './name-lookup-form';

type SearchParams = Record<string, string | string[] | undefined>;

/** List page shared by the name-only sections. */
export async function NameLookupListPage({
  lookup,
  searchParams,
}: {
  lookup: NameLookupKey;
  searchParams: SearchParams;
}) {
  const config = nameLookups[lookup];
  const { permissions } = await getAdminAccess(config.basePath);
  const can = resourcePermissions(permissions, config.permissionPrefix);
  if (!can.canList) {
    return <AccessDenied />;
  }

  const search = searchParam(searchParams.search);
  const records = await apiRequest<AdminLookup[]>(config.apiPath);
  const rows = records.filter((record) => matchesSearch(search, record.name));

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          can.canCreate ? (
            <ButtonLink
              href={`${config.basePath}/new`}
              icon={<Plus aria-hidden className="size-4" />}
            >
              Add {config.singular}
            </ButtonLink>
          ) : undefined
        }
      />
      <Notice notice={searchParams.notice} />
      <FilterBar search={search} searchPlaceholder={`Search ${config.title.toLowerCase()}`} />
      <DataTable
        rows={rows}
        rowKey={(row) => row.id}
        emptyMessage={search === undefined ? 'Nothing here yet.' : 'No matches for your search.'}
        columns={[
          { header: 'ID', cell: (row) => row.id, className: 'w-20 text-stone-500' },
          { header: 'Name', cell: (row) => row.name, className: 'font-medium' },
          {
            header: 'Actions',
            className: 'w-32 text-right',
            cell: (row) => (
              <RowActions
                resource={config.resource}
                id={row.id}
                label={`${config.singular} ${row.name}`}
                editHref={can.canEdit ? `${config.basePath}/${row.id}/edit` : undefined}
                canDelete={can.canDelete}
              />
            ),
          },
        ]}
      />
    </>
  );
}

/** Create (id null) or edit page shared by the name-only sections. */
export async function NameLookupFormPage({
  lookup,
  id,
}: {
  lookup: NameLookupKey;
  id: number | null;
}) {
  const config = nameLookups[lookup];
  const { permissions } = await getAdminAccess(config.basePath);
  const can = resourcePermissions(permissions, config.permissionPrefix);
  if (id === null ? !can.canCreate : !can.canEdit) {
    return <AccessDenied />;
  }

  const record =
    id === null ? null : await getRecordOrNotFound<AdminLookup>(`${config.apiPath}/${id}`);

  return (
    <>
      <PageHeader
        title={record === null ? `Add ${config.singular}` : `Edit ${record.name}`}
        back={{ href: config.basePath, label: config.title }}
      />
      <NameLookupForm
        lookup={lookup}
        id={id}
        initialName={record?.name ?? ''}
        maxLength={config.maxLength}
        cancelHref={config.basePath}
      />
    </>
  );
}
