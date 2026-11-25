import { Receipt } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BookingDetails } from '@/components/bookings/booking-details';
import { OrderSummary } from '@/components/bookings/order-summary';
import { needsPayment, PaymentStatusBadge } from '@/components/bookings/payment-status-badge';
import { PayNowButton } from '@/components/payments/pay-now-button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { getMyBookingOrNotFound } from '@/lib/api/queries';
import type { PaymentSummary } from '@/lib/api/types';
import { requireUser } from '@/lib/auth/current-user';
import { bookingPriceLines } from '@/lib/content/booking-price';
import { formatDate, formatDateTime, formatRupees } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Booking details',
  robots: { index: false },
};

const paymentLabel: Record<PaymentSummary['status'], string> = {
  pending: 'Started',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export default async function MyBookingPage({
  params,
  searchParams,
}: PageProps<'/my-bookings/[bookingId]'>) {
  const { bookingId } = await params;
  const { placed } = await searchParams;
  await requireUser(`/my-bookings/${bookingId}`);
  const booking = await getMyBookingOrNotFound(Number(bookingId));
  const lines = await bookingPriceLines(booking);
  const total = booking.totalAmount ?? 0;

  return (
    <Container className="py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-sm text-stone-500">
        <Link href="/my-bookings" className="hover:text-espresso-900">
          My bookings
        </Link>
        <span aria-hidden> / </span>
        <span className="text-espresso-900">{booking.code}</span>
      </nav>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold sm:text-3xl">Booking {booking.code}</h1>
        <PaymentStatusBadge status={booking.paymentStatus} />
      </div>
      {booking.createdAt !== null && (
        <p className="mt-1 text-sm text-stone-500">Booked on {formatDateTime(booking.createdAt)}</p>
      )}

      {placed === '1' && (
        <Alert tone="success" title="Booking confirmed" className="mt-6">
          Thank you! Your booking has been placed and a confirmation email is on its way.
        </Alert>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="flex flex-col gap-6">
          <BookingDetails booking={booking} />
          {booking.payments.length > 0 && (
            <section className="rounded-card border border-stone-200 bg-white p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Receipt aria-hidden className="size-5 text-gold-600" />
                Payments
              </h2>
              <ul className="mt-4 divide-y divide-stone-100 text-sm">
                {booking.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Badge tone={payment.status === 'paid' ? 'success' : 'neutral'}>
                        {paymentLabel[payment.status]}
                      </Badge>
                      <span className="text-stone-600">
                        {formatRupees(payment.amount)} · {payment.paymentMethod ?? 'Card'}
                      </span>
                    </span>
                    <span className="text-stone-500">
                      {formatDateTime(payment.paidAt ?? payment.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="lg:sticky lg:top-24">
          <OrderSummary
            serviceName={booking.service.name}
            productName={booking.product?.name ?? booking.service.name}
            lines={lines}
            total={total}
            details={[{ label: 'Departure', value: formatDate(booking.departureDate) }]}
            footer={
              needsPayment(booking.paymentStatus) ? (
                <PayNowButton bookingId={booking.id} amount={total} />
              ) : undefined
            }
          />
        </div>
      </div>
    </Container>
  );
}
