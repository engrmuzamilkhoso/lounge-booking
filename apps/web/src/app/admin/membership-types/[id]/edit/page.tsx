import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { getRecordOrNotFound, idParam } from '@/lib/admin/queries';
import type { AdminMembershipType } from '@/lib/admin/types';
import { MembershipTypeForm } from '../../membership-type-form';

export const metadata: Metadata = { title: 'Edit membership type' };

export default async function EditMembershipTypePage({
  params,
}: PageProps<'/admin/membership-types/[id]/edit'>) {
  const { permissions } = await getAdminAccess('/admin/membership-types');
  if (!permissions.has('membership_type_edit')) {
    return <AccessDenied />;
  }
  const { id } = await params;
  const type = await getRecordOrNotFound<AdminMembershipType>(
    `/admin/membership-types/${idParam(id)}`,
  );
  return (
    <>
      <PageHeader
        title={`Edit ${type.name}`}
        back={{ href: '/admin/membership-types', label: 'Membership types' }}
      />
      <MembershipTypeForm
        id={type.id}
        initialValues={{
          name: type.name,
          price1: type.price1,
          price1Text: type.price1Text,
          price2: type.price2,
          price2Text: type.price2Text,
        }}
      />
    </>
  );
}
