import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { DataTable } from '@/components/admin/data-table';
import { Notice } from '@/components/admin/notice';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { ButtonLink } from '@/components/ui/button';
import { getAdminAccess, resourcePermissions } from '@/lib/admin/access';
import type { AdminService } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';

export const metadata: Metadata = { title: 'Services' };

export default async function AdminServicesPage({ searchParams }: PageProps<'/admin/services'>) {
  const { permissions } = await getAdminAccess('/admin/services');
  const can = resourcePermissions(permissions, 'service');
  if (!can.canList) {
    return <AccessDenied />;
  }
  const { notice } = await searchParams;
  const services = await apiRequest<AdminService[]>('/admin/services');

  return (
    <>
      <PageHeader
        title="Services"
        description="The services customers can book. Bookings and products refer to these by id, so rename rather than delete."
        actions={
          can.canCreate ? (
            <ButtonLink href="/admin/services/new" icon={<Plus aria-hidden className="size-4" />}>
              Add service
            </ButtonLink>
          ) : undefined
        }
      />
      <Notice notice={notice} />
      <DataTable
        rows={services}
        rowKey={(service) => service.id}
        emptyMessage="No services yet."
        columns={[
          { header: 'ID', cell: (service) => service.id, className: 'w-20 text-stone-500' },
          { header: 'Name', cell: (service) => service.name, className: 'font-medium' },
          {
            header: 'App description',
            cell: (service) => service.appDescription ?? '—',
            className: 'hidden md:table-cell text-stone-600',
          },
          {
            header: 'Actions',
            className: 'w-32 text-right',
            cell: (service) => (
              <RowActions
                resource="services"
                id={service.id}
                label={`service ${service.name}`}
                editHref={can.canEdit ? `/admin/services/${service.id}/edit` : undefined}
                canDelete={can.canDelete}
              />
            ),
          },
        ]}
      />
    </>
  );
}
