import type { Metadata } from 'next';
import Link from 'next/link';
import { AccessDenied } from '@/components/admin/access-denied';
import { DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { getAdminAccess } from '@/lib/admin/access';
import { auditRecordLabel } from '@/lib/admin/audit-labels';
import { pageParam } from '@/lib/admin/queries';
import type { AdminAuditLog } from '@/lib/admin/types';
import { apiRequestPage, toQueryString } from '@/lib/api/server-api';
import { formatDateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Audit log' };

const PAGE_SIZE = 30;

const actions: Record<string, { label: string; tone: BadgeTone }> = {
  'audit:created': { label: 'Created', tone: 'success' },
  'audit:updated': { label: 'Updated', tone: 'info' },
  'audit:deleted': { label: 'Deleted', tone: 'danger' },
};

export default async function AuditLogsPage({ searchParams }: PageProps<'/admin/audit-logs'>) {
  const { permissions } = await getAdminAccess('/admin/audit-logs');
  if (!permissions.has('audit_log_access')) {
    return <AccessDenied />;
  }
  const params = await searchParams;
  const page = pageParam(params.page);
  const logs = await apiRequestPage<AdminAuditLog>(
    `/admin/audit-logs${toQueryString({ page, pageSize: PAGE_SIZE })}`,
  );
  const canShow = permissions.has('audit_log_show');

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every change made to bookings, memberships and catalogue records, newest first."
      />
      <DataTable
        rows={logs.items}
        rowKey={(log) => log.id}
        emptyMessage="Nothing recorded yet."
        columns={[
          {
            header: 'When',
            className: 'whitespace-nowrap',
            cell: (log) => (log.createdAt === null ? '—' : formatDateTime(log.createdAt)),
          },
          {
            header: 'Action',
            cell: (log) => {
              const action = actions[log.description];
              return action === undefined ? (
                <Badge>{log.description}</Badge>
              ) : (
                <Badge tone={action.tone}>{action.label}</Badge>
              );
            },
          },
          {
            header: 'Record',
            cell: (log) => auditRecordLabel(log),
          },
          {
            header: 'User',
            className: 'hidden md:table-cell',
            cell: (log) => (log.userId === null ? 'System' : `User #${log.userId}`),
          },
          {
            header: 'IP address',
            className: 'hidden lg:table-cell text-stone-500',
            cell: (log) => log.host ?? '—',
          },
          {
            header: '',
            className: 'w-20 text-right',
            cell: (log) =>
              canShow ? (
                <Link
                  href={`/admin/audit-logs/${log.id}`}
                  className="text-sm font-medium text-gold-600 hover:underline"
                >
                  Details
                </Link>
              ) : null,
          },
        ]}
      />
      <Pagination meta={logs.meta} basePath="/admin/audit-logs" params={{}} />
    </>
  );
}
