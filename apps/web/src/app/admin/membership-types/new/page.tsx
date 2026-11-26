import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { MembershipTypeForm } from '../membership-type-form';

export const metadata: Metadata = { title: 'Add membership type' };

export default async function NewMembershipTypePage() {
  const { permissions } = await getAdminAccess('/admin/membership-types');
  if (!permissions.has('membership_type_create')) {
    return <AccessDenied />;
  }
  return (
    <>
      <PageHeader
        title="Add membership type"
        back={{ href: '/admin/membership-types', label: 'Membership types' }}
      />
      <MembershipTypeForm id={null} initialValues={{ name: '', price1Text: '', price2Text: '' }} />
    </>
  );
}
