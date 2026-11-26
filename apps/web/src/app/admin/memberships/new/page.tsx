import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import type { AdminMembershipType } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';
import { MembershipForm } from '../membership-form';

export const metadata: Metadata = { title: 'Add membership' };

export default async function NewMembershipPage() {
  const { permissions } = await getAdminAccess('/admin/memberships');
  if (!permissions.has('membership_create')) {
    return <AccessDenied />;
  }
  const types = await apiRequest<AdminMembershipType[]>('/membership-types', {
    authenticated: false,
  });

  return (
    <>
      <PageHeader
        title="Add membership"
        description="Created as an application; approve it afterwards to issue the serial number."
        back={{ href: '/admin/memberships', label: 'Memberships' }}
      />
      <MembershipForm
        id={null}
        initialValues={{ country: 'Pakistan' }}
        membershipTypes={types.map((type) => ({ value: type.id, label: type.name }))}
      />
    </>
  );
}
