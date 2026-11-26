import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { getRecordOrNotFound, idParam } from '@/lib/admin/queries';
import type { AdminMembership, AdminMembershipType } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';
import { MembershipForm } from '../../membership-form';

export const metadata: Metadata = { title: 'Edit membership' };

export default async function EditMembershipPage({
  params,
}: PageProps<'/admin/memberships/[id]/edit'>) {
  const { permissions } = await getAdminAccess('/admin/memberships');
  if (!permissions.has('membership_edit')) {
    return <AccessDenied />;
  }
  const { id } = await params;
  const [membership, types] = await Promise.all([
    getRecordOrNotFound<AdminMembership>(`/admin/memberships/${idParam(id)}`),
    apiRequest<AdminMembershipType[]>('/membership-types', { authenticated: false }),
  ]);

  return (
    <>
      <PageHeader
        title={`Edit ${membership.name}`}
        back={{ href: `/admin/memberships/${membership.id}`, label: membership.name }}
      />
      <MembershipForm
        id={membership.id}
        initialValues={{
          name: membership.name,
          membershipTypeId: membership.membershipType?.id,
          dob: membership.dob,
          contactNo: membership.contactNo,
          email: membership.email,
          address: membership.address ?? '',
          city: membership.city,
          state: membership.state,
          zipcode: membership.zipcode,
          country: membership.country,
        }}
        membershipTypes={types.map((type) => ({ value: type.id, label: type.name }))}
      />
    </>
  );
}
