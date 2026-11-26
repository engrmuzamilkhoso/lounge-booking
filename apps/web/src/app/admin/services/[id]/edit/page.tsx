import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { getRecordOrNotFound, idParam } from '@/lib/admin/queries';
import type { AdminService } from '@/lib/admin/types';
import { ServiceForm } from '../../service-form';

export const metadata: Metadata = { title: 'Edit service' };

export default async function EditServicePage({ params }: PageProps<'/admin/services/[id]/edit'>) {
  const { permissions } = await getAdminAccess('/admin/services');
  if (!permissions.has('service_edit')) {
    return <AccessDenied />;
  }
  const { id } = await params;
  const service = await getRecordOrNotFound<AdminService>(`/admin/services/${idParam(id)}`);
  return (
    <>
      <PageHeader
        title={`Edit ${service.name}`}
        back={{ href: '/admin/services', label: 'Services' }}
      />
      <ServiceForm
        id={service.id}
        initialValues={{
          name: service.name,
          appDescription: service.appDescription ?? '',
          appRoute: service.appRoute ?? '',
          appIcon: service.appIcon ?? '',
          iconForApp: service.iconForApp ?? '',
        }}
      />
    </>
  );
}
