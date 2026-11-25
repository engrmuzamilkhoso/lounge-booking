import { CircleUserRound, CreditCard } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BookingDetails } from '@/components/bookings/booking-details';
import { OrderSummary } from '@/components/bookings/order-summary';
import { needsPayment } from '@/components/bookings/payment-status-badge';
import { PayNowButton } from '@/components/payments/pay-now-button';
import { SafepayMark } from '@/components/payments/safepay-mark';
import { Alert } from '@/components/ui/alert';
import { Container } from '@/components/ui/container';
import { getMyBookingOrNotFound } from '@/lib/api/queries';
import { displayName, requireUser } from '@/lib/auth/current-user';
import { bookingPriceLines } from '@/lib/content/booking-price';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false },
};

export default async function CheckoutPage({
  params,
  searchParams,
}: PageProps<'/checkout/[bookingId]'>) {
  const { bookingId } = await params;
  const { payment } = await searchParams;
  const user = await requireUser(`/checkout/${bookingId}`);
  const booking = await getMyBookingOrNotFound(Number(bookingId));

  // Nothing to pay (free, already paid or refunded): show the booking instead.
  if (!needsPayment(booking.paymentStatus)) {
    redirect(`/my-bookings/${booking.id}`);
  }

  const lines = await bookingPriceLines(booking);
  const total = booking.totalAmount ?? 0;
  const wasCancelled = payment === 'cancelled';
  const lastAttemptFailed = booking.paymentStatus === 'failed';

  return (
    <Container className="py-10 sm:py-14">
      <p className="text-sm font-semibold tracking-wider text-gold-600 uppercase">Checkout</p>
      <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Review and pay</h1>
      <p className="mt-2 text-stone-600">
        Booking <span className="font-semibold text-espresso-900">{booking.code}</span> is reserved
        and will be confirmed once payment is complete.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="flex flex-col gap-6">
          {wasCancelled && (
            <Alert tone="warning" title="Payment cancelled">
              You left the Safepay page before paying. Your booking is still reserved — you can pay
              below.
            </Alert>
          )}
          {!wasCancelled && lastAttemptFailed && (
            <Alert tone="error" title="The last payment attempt did not go through">
              No money was taken. Please try again, or use a different card.
            </Alert>
          )}

          <section className="rounded-card border border-stone-200 bg-white p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <CircleUserRound aria-hidden className="size-5 text-gold-600" />
              Customer
            </h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-stone-500">Name</dt>
                <dd className="mt-0.5 font-medium text-espresso-900">{displayName(user)}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Email</dt>
                <dd className="mt-0.5 font-medium break-all text-espresso-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Phone</dt>
                <dd className="mt-0.5 font-medium text-espresso-900">{user.contact ?? '—'}</dd>
              </div>
            </dl>
          </section>

          <BookingDetails booking={booking} />

          <section className="rounded-card border border-stone-200 bg-white p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <CreditCard aria-hidden className="size-5 text-gold-600" />
              Payment method
            </h2>
            <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-xl border-2 border-gold-500 bg-gold-50/50 p-4">
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment-method"
                  value="safepay"
                  defaultChecked
                  className="size-4 accent-espresso-900"
                />
                <span>
                  <span className="block text-sm font-semibold text-espresso-900">
                    Debit or credit card
                  </span>
                  <span className="block text-xs text-stone-600">
                    Visa and Mastercard, processed securely by Safepay
                  </span>
                </span>
              </span>
              <SafepayMark />
            </label>
          </section>
        </div>

        <div className="lg:sticky lg:top-24">
          <OrderSummary
            serviceName={booking.service.name}
            productName={booking.product?.name ?? booking.service.name}
            lines={lines}
            total={total}
            details={[
              { label: 'Booking', value: booking.code },
              { label: 'Departure', value: formatDate(booking.departureDate) },
            ]}
            footer={
              <>
                <PayNowButton bookingId={booking.id} amount={total} />
                <p className="mt-3 text-center text-xs leading-relaxed text-stone-500">
                  You will be taken to Safepay&apos;s secure page to enter your card details.
                  Majestic never sees or stores your card number.
                </p>
              </>
            }
          />
        </div>
      </div>
    </Container>
  );
}
