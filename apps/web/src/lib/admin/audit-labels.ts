import type { AdminAuditLog } from './types';

/**
 * "Booking #8" for an audit entry. `subjectType` is stored as "Booking#8" (new entries) or
 * "App\Models\Booking#8" (imported Laravel entries); only the model name is kept.
 */
export function auditRecordLabel(log: AdminAuditLog): string {
  if (log.subjectType === null) {
    return '—';
  }
  const withoutId = log.subjectType.split('#')[0] ?? log.subjectType;
  const modelName = withoutId.split('\\').pop() ?? withoutId;
  return log.subjectId === null ? modelName : `${modelName} #${log.subjectId}`;
}
