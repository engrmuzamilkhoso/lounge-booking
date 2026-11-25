import { BookingPaymentStatus } from '@booking/shared-types';
import { Badge, type BadgeTone } from '@/components/ui/badge';

const presentation: Record<BookingPaymentStatus, { label: string; tone: BadgeTone }> = {
  [BookingPaymentStatus.NotRequired]: { label: 'Confirmed', tone: 'success' },
  [BookingPaymentStatus.Pending]: { label: 'Awaiting payment', tone: 'warning' },
  [BookingPaymentStatus.Paid]: { label: 'Paid', tone: 'success' },
  [BookingPaymentStatus.Failed]: { label: 'Payment failed', tone: 'danger' },
  [BookingPaymentStatus.Refunded]: { label: 'Refunded', tone: 'neutral' },
};

export function PaymentStatusBadge({ status }: { status: BookingPaymentStatus }) {
  const { label, tone } = presentation[status];
  return <Badge tone={tone}>{label}</Badge>;
}

/** Bookings the customer can still pay for online. */
export function needsPayment(status: BookingPaymentStatus): boolean {
  return status === BookingPaymentStatus.Pending || status === BookingPaymentStatus.Failed;
}
