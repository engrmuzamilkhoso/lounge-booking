import { BookingPaymentStatus } from '@booking/shared-types';
import { CircleCheck, CircleX, Clock } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { BookingDetails } from '@/components/bookings/booking-details';
import { PayNowButton } from '@/components/payments/pay-now-button';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { ApiError } from '@/lib/api/api-error';
import { getMyBookingOrNotFound } from '@/lib/api/queries';
import { apiRequest } from '@/lib/api/server-api';
import type { Booking, PaymentConfirmation } from '@/lib/api/types';
import { requireUser } from '@/lib/auth/current-user';
import { formatDateTime, formatRupees } from '@/lib/format';
import { siteConfig } from '@/lib/site-config';
import { AutoRefresh } from './auto-refresh';

export const metadata: Metadata = {
  title: 'Payment result',
  robots: { index: false },
};

const REFRESH_INTERVAL_MS = 4000;
const MAX_REFRESH_ATTEMPTS = 8;

/**
 * Safepay returns the customer here with `?tracker=…`. The API verifies the payment with Safepay
 * before anything is shown as paid; this page only displays the verified result.
 */
export default async function PaymentCompletePage({
  params,
  searchParams,
}: PageProps<'/checkout/[bookingId]/complete'>) {
  const { bookingId } = await params;
  const { tracker, attempt } = await searchParams;
  await requireUser(`/checkout/${bookingId}`);

  if (typeof tracker !== 'string' || tracker === '') {
    redirect(`/checkout/${bookingId}`);
  }

  let verificationFailed = false;
  try {
    await apiRequest<PaymentConfirmation>('/payments/safepay/confirm', {
      method: 'POST',
      body: { tracker },
    });
  } catch (error) {
    // Safepay unreachable or tracker not ours: show the booking's last known state instead.
    if (!(error instanceof ApiError)) {
      throw error;
    }
    verificationFailed = true;
  }

  const booking = await getMyBookingOrNotFound(Number(bookingId));
  const attemptNumber = Number(typeof attempt === 'string' ? attempt : '0');

  if (booking.paymentStatus === BookingPaymentStatus.Paid) {
    return <PaidResult booking={booking} />;
  }
  // Still pending — including when Safepay could not be reached just now. Never tell a customer
  // who may have paid that the payment failed; keep checking instead.
  if (booking.paymentStatus === BookingPaymentStatus.Pending) {
    const description = verificationFailed
      ? "We couldn't reach Safepay to confirm your payment yet. This page keeps checking — please don't pay again."
      : "Safepay is still finishing your payment. This page updates automatically — please don't pay again.";
    return (
      <ResultLayout
        icon={<Clock aria-hidden className="size-8" />}
        tone="pending"
        title="Confirming your payment…"
        description={description}
      >
        <AutoRefresh
          intervalMs={REFRESH_INTERVAL_MS}
          maxAttempts={MAX_REFRESH_ATTEMPTS}
          attempt={attemptNumber}
        />
        {attemptNumber >= MAX_REFRESH_ATTEMPTS && (
          <p className="text-sm text-stone-600">
            Taking longer than usual. You will receive an email as soon as the payment is confirmed,
            and you can check the status in{' '}
            <a
              href={`/my-bookings/${booking.id}`}
              className="font-semibold text-gold-600 underline"
            >
              My bookings
            </a>
            .
          </p>
        )}
      </ResultLayout>
    );
  }

  return (
    <ResultLayout
      icon={<CircleX aria-hidden className="size-8" />}
      tone="failed"
      title="Payment not completed"
      description="Your card was not charged. Your booking is still reserved, so you can try again."
    >
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <PayNowButton bookingId={booking.id} amount={booking.totalAmount ?? 0} label="Try again" />
        <ButtonLink href={`/my-bookings/${booking.id}`} variant="secondary">
          View booking
        </ButtonLink>
        <p className="text-xs text-stone-500">
          Need help? Call {siteConfig.contact.phone} or email {siteConfig.contact.email} with
          booking {booking.code}.
        </p>
      </div>
    </ResultLayout>
  );
}

function PaidResult({ booking }: { booking: Booking }) {
  const payment = booking.payments.find((candidate) => candidate.status === 'paid');
  return (
    <ResultLayout
      icon={<CircleCheck aria-hidden className="size-8" />}
      tone="success"
      title="Payment successful"
      description={`Your booking ${booking.code} is confirmed. A confirmation email is on its way.`}
    >
      {payment !== undefined && (
        <dl className="mx-auto grid w-full max-w-lg gap-3 rounded-xl border border-stone-200 bg-stone-50 p-5 text-left text-sm sm:grid-cols-2">
          <ReceiptRow label="Amount paid" value={formatRupees(payment.amount)} />
          <ReceiptRow
            label="Paid on"
            value={payment.paidAt === null ? '—' : formatDateTime(payment.paidAt)}
          />
          <ReceiptRow label="Card" value={payment.paymentMethod ?? 'Card'} />
          <ReceiptRow label="Safepay reference" value={payment.reference} mono />
        </dl>
      )}
      <div className="mt-8 text-left">
        <BookingDetails booking={booking} />
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href={`/my-bookings/${booking.id}`}>View booking</ButtonLink>
        <ButtonLink href="/services" variant="secondary">
          Book another service
        </ButtonLink>
      </div>
    </ResultLayout>
  );
}

const toneClasses = {
  success: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-700',
} as const;

function ResultLayout({
  icon,
  tone,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  tone: keyof typeof toneClasses;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Container className="max-w-3xl py-12 text-center sm:py-16">
      <span
        className={`mx-auto flex size-16 items-center justify-center rounded-full ${toneClasses[tone]}`}
      >
        {icon}
      </span>
      <h1 className="mt-6 text-2xl font-semibold sm:text-3xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-xl text-stone-600">{description}</p>
      <div className="mt-8">{children}</div>
    </Container>
  );
}

function ReceiptRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-stone-500">{label}</dt>
      <dd
        className={
          mono
            ? 'mt-0.5 font-mono text-xs break-all text-espresso-900'
            : 'mt-0.5 font-medium text-espresso-900'
        }
      >
        {value}
      </dd>
    </div>
  );
}
