import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { ServiceForm } from '../service-form';

export const metadata: Metadata = { title: 'Add service' };

export default async function NewServicePage() {
  const { permissions } = await getAdminAccess('/admin/services');
  if (!permissions.has('service_create')) {
    return <AccessDenied />;
  }
  return (
    <>
      <PageHeader title="Add service" back={{ href: '/admin/services', label: 'Services' }} />
      <ServiceForm
        id={null}
        initialValues={{ name: '', appDescription: '', appRoute: '', appIcon: '', iconForApp: '' }}
      />
    </>
  );
}
