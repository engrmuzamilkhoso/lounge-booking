import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { DataTable } from '@/components/admin/data-table';
import { Notice } from '@/components/admin/notice';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { getAdminAccess, resourcePermissions } from '@/lib/admin/access';
import type { AdminCard } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';

export const metadata: Metadata = { title: 'Bank cards' };

export default async function AdminCardsPage({ searchParams }: PageProps<'/admin/cards'>) {
  const { permissions } = await getAdminAccess('/admin/cards');
  const can = resourcePermissions(permissions, 'card');
  if (!can.canList) {
    return <AccessDenied />;
  }
  const { notice } = await searchParams;
  const cards = await apiRequest<AdminCard[]>('/admin/cards');

  return (
    <>
      <PageHeader
        title="Bank cards"
        description="Cards that give free lounge access. Only active cards are offered to customers."
        actions={
          can.canCreate ? (
            <ButtonLink href="/admin/cards/new" icon={<Plus aria-hidden className="size-4" />}>
              Add card
            </ButtonLink>
          ) : undefined
        }
      />
      <Notice notice={notice} />
      <DataTable
        rows={cards}
        rowKey={(card) => card.id}
        emptyMessage="No bank cards yet."
        columns={[
          {
            header: 'Card',
            cell: (card) => (
              <span>
                <span className="font-medium">{card.name}</span>
                <span className="block text-xs text-stone-500">{card.detail}</span>
              </span>
            ),
          },
          {
            header: 'BIN numbers',
            className: 'hidden md:table-cell font-mono text-xs break-all',
            cell: (card) => card.bin,
          },
          {
            header: 'Order',
            className: 'hidden md:table-cell',
            cell: (card) => card.sortOrder ?? '—',
          },
          {
            header: 'Status',
            cell: (card) =>
              card.isActive ? <Badge tone="success">Active</Badge> : <Badge>Hidden</Badge>,
          },
          {
            header: 'Actions',
            className: 'w-32 text-right',
            cell: (card) => (
              <RowActions
                resource="cards"
                id={card.id}
                label={`card ${card.name}`}
                editHref={can.canEdit ? `/admin/cards/${card.id}/edit` : undefined}
                canDelete={can.canDelete}
              />
            ),
          },
        ]}
      />
    </>
  );
}
