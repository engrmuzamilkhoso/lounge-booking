import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { CardForm } from '../card-form';

export const metadata: Metadata = { title: 'Add bank card' };

export default async function NewCardPage() {
  const { permissions } = await getAdminAccess('/admin/cards');
  if (!permissions.has('card_create')) {
    return <AccessDenied />;
  }
  return (
    <>
      <PageHeader title="Add bank card" back={{ href: '/admin/cards', label: 'Bank cards' }} />
      <CardForm
        id={null}
        initialValues={{ name: '', detail: '', bin: '', sortOrder: Number.NaN, isActive: true }}
      />
    </>
  );
}
