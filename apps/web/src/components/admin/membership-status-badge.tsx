import { MembershipStatus } from '@booking/shared-types';
import { Badge } from '@/components/ui/badge';

export function MembershipStatusBadge({ status }: { status: MembershipStatus }) {
  if (status === MembershipStatus.Approved) {
    return <Badge tone="success">Approved</Badge>;
  }
  return <Badge tone="warning">Awaiting approval</Badge>;
}
