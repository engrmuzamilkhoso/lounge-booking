import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { auditRecordLabel } from '@/lib/admin/audit-labels';
import { getRecordOrNotFound, idParam } from '@/lib/admin/queries';
import type { AdminAuditLog } from '@/lib/admin/types';
import { formatDateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Audit entry' };

export default async function AuditLogPage({ params }: PageProps<'/admin/audit-logs/[id]'>) {
  const { permissions } = await getAdminAccess('/admin/audit-logs');
  if (!permissions.has('audit_log_show')) {
    return <AccessDenied />;
  }
  const { id } = await params;
  const log = await getRecordOrNotFound<AdminAuditLog>(`/admin/audit-logs/${idParam(id)}`);

  return (
    <>
      <PageHeader
        title={`Audit entry #${log.id}`}
        back={{ href: '/admin/audit-logs', label: 'Audit log' }}
      />
      <div className="max-w-3xl rounded-card border border-stone-200 bg-white p-6 shadow-card">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Detail label="Action" value={log.description} />
          <Detail
            label="When"
            value={log.createdAt === null ? '—' : formatDateTime(log.createdAt)}
          />
          <Detail label="Record" value={auditRecordLabel(log)} />
          <Detail label="User" value={log.userId === null ? 'System' : `User #${log.userId}`} />
          <Detail label="IP address" value={log.host ?? '—'} />
        </dl>
        <h2 className="mt-6 mb-2 text-sm font-semibold">Recorded values</h2>
        <pre className="overflow-x-auto rounded-lg bg-stone-50 p-4 text-xs leading-relaxed text-espresso-900">
          {JSON.stringify(log.properties, null, 2)}
        </pre>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-stone-500">{label}</dt>
      <dd className="mt-0.5 font-medium break-words text-espresso-900">{value}</dd>
    </div>
  );
}
