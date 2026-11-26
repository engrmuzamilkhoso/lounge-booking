import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { getRecordOrNotFound, idParam } from '@/lib/admin/queries';
import type { AdminCard } from '@/lib/admin/types';
import { CardForm } from '../../card-form';

export const metadata: Metadata = { title: 'Edit bank card' };

export default async function EditCardPage({ params }: PageProps<'/admin/cards/[id]/edit'>) {
  const { permissions } = await getAdminAccess('/admin/cards');
  if (!permissions.has('card_edit')) {
    return <AccessDenied />;
  }
  const { id } = await params;
  const card = await getRecordOrNotFound<AdminCard>(`/admin/cards/${idParam(id)}`);
  return (
    <>
      <PageHeader
        title={`Edit ${card.name}`}
        back={{ href: '/admin/cards', label: 'Bank cards' }}
      />
      <CardForm
        id={card.id}
        initialValues={{
          name: card.name,
          detail: card.detail,
          bin: card.bin,
          sortOrder: card.sortOrder ?? Number.NaN,
          isActive: card.isActive,
        }}
      />
    </>
  );
}
