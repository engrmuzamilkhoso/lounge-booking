import { AttendeeType, PassStatus } from '@booking/shared-types';
import { CircleCheck, CircleX, History, ScanLine, ShieldAlert } from 'lucide-react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Alert } from '@/components/ui/alert';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { ApiError } from '@/lib/api/api-error';
import { apiRequest } from '@/lib/api/server-api';
import type { Attendee, PassVerification } from '@/lib/api/types';
import { requireUser } from '@/lib/auth/current-user';
import { formatDate, formatDateTime, formatTime } from '@/lib/format';
import { CheckInButton } from './check-in-button';

export const metadata: Metadata = {
  title: 'Verify lounge pass',
  robots: { index: false, follow: false },
};

const attendeeTypeLabel: Record<AttendeeType, string> = {
  [AttendeeType.Adult]: 'Adult',
  [AttendeeType.Child]: 'Child',
  [AttendeeType.Infant]: 'Infant',
};

/**
 * Opened by scanning a customer's pass QR code. Staff see at a glance whether to let the
 * customer in, check the passengers' ID against the booking, and check the pass in.
 */
export default async function VerifyPassPage({ params }: PageProps<'/staff/pass/[token]'>) {
  const { token } = await params;
  await requireUser(`/staff/pass/${token}`);

  let verification: PassVerification;
  try {
    verification = await apiRequest<PassVerification>(
      `/admin/booking-passes/${encodeURIComponent(token)}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.isForbidden) {
      return <StaffOnly />;
    }
    if (error instanceof ApiError && error.isNotFound) {
      return (
        <PassLayout>
          <Verdict
            tone="refused"
            icon={<CircleX aria-hidden className="size-10" />}
            title="Pass not recognised"
            description="This QR code does not belong to any booking. Do not let the customer in; ask for the booking reference instead."
          />
        </PassLayout>
      );
    }
    throw error;
  }

  const { booking } = verification;
  return (
    <PassLayout>
      <PassVerdict verification={verification} />

      {verification.status === PassStatus.Valid && !verification.departsToday && (
        <Alert tone="warning" title="Departure is not today" className="mt-4">
          This booking departs on {formatDate(booking.departureDate)}. Check with the customer
          before letting them in.
        </Alert>
      )}

      {verification.status === PassStatus.Valid && (
        <div className="mt-6">
          <CheckInButton passToken={token} />
        </div>
      )}

      <section className="mt-8 rounded-card border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="text-base font-semibold">Booking {booking.code}</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <Detail
            label="Service"
            value={[booking.service.name, booking.product?.name]
              .filter((part) => part !== undefined && part !== null)
              .join(' · ')}
          />
          <Detail label="Customer" value={customerName(verification)} />
          <Detail label="Flight" value={booking.flightNumber} />
          <Detail
            label="Departure"
            value={`${formatDate(booking.departureDate)}, ${formatTime(booking.departureTime)}`}
          />
          <Detail label="Passengers" value={passengerSummary(verification)} />
          <Detail label="Payment" value={paymentSummary(verification)} />
        </dl>
      </section>

      <section className="mt-6 rounded-card border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="text-base font-semibold">Check passengers&apos; ID</h2>
        <ul className="mt-4 divide-y divide-stone-100 text-sm">
          {booking.attendees.map((attendee) => (
            <li
              key={attendee.id}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between"
            >
              <span className="font-medium text-espresso-900">
                {attendee.name}{' '}
                <span className="font-normal text-stone-500">
                  ({attendeeTypeLabel[attendee.type]})
                </span>
              </span>
              <span className="text-stone-600">{identityDocument(attendee)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex justify-center">
        <ButtonLink
          href="/staff/check-in"
          variant="secondary"
          icon={<ScanLine aria-hidden className="size-4" />}
        >
          Scan next pass
        </ButtonLink>
      </div>
    </PassLayout>
  );
}

function PassVerdict({ verification }: { verification: PassVerification }) {
  switch (verification.status) {
    case PassStatus.Valid:
      return (
        <Verdict
          tone="authorised"
          icon={<CircleCheck aria-hidden className="size-10" />}
          title="Authorised"
          description="This booking is paid and has not been used. Check the passengers' ID, then check the pass in."
        />
      );
    case PassStatus.AlreadyUsed: {
      const checkedIn =
        verification.checkedInAt === null ? '' : ` on ${formatDateTime(verification.checkedInAt)}`;
      const checkedInBy =
        verification.checkedInBy === null ? '' : ` by ${verification.checkedInBy.name}`;
      return (
        <Verdict
          tone="used"
          icon={<History aria-hidden className="size-10" />}
          title="Already used"
          description={`This pass was checked in${checkedIn}${checkedInBy}. A pass can be used once.`}
        />
      );
    }
    case PassStatus.PaymentRequired:
      return (
        <Verdict
          tone="refused"
          icon={<CircleX aria-hidden className="size-10" />}
          title="Not authorised: not paid"
          description="This booking has not been paid. The customer can pay online from My bookings."
        />
      );
    case PassStatus.Expired:
      return (
        <Verdict
          tone="refused"
          icon={<CircleX aria-hidden className="size-10" />}
          title="Not authorised: expired"
          description={`The departure date (${formatDate(verification.booking.departureDate)}) has passed.`}
        />
      );
    case PassStatus.Cancelled:
      return (
        <Verdict
          tone="refused"
          icon={<CircleX aria-hidden className="size-10" />}
          title="Not authorised: cancelled"
          description="This booking was cancelled."
        />
      );
  }
}

const verdictClasses = {
  authorised: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  used: 'border-amber-300 bg-amber-50 text-amber-800',
  refused: 'border-red-300 bg-red-50 text-red-800',
} as const;

function Verdict({
  tone,
  icon,
  title,
  description,
}: {
  tone: keyof typeof verdictClasses;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center gap-3 rounded-card border-2 p-6 text-center sm:p-8 ${verdictClasses[tone]}`}
    >
      {icon}
      <h1 className="text-2xl font-bold uppercase tracking-wide sm:text-3xl">{title}</h1>
      <p className="max-w-lg text-sm sm:text-base">{description}</p>
    </div>
  );
}

function StaffOnly() {
  return (
    <PassLayout>
      <div className="flex flex-col items-center gap-3 rounded-card border border-stone-200 bg-white p-8 text-center shadow-card">
        <ShieldAlert aria-hidden className="size-10 text-gold-600" />
        <h1 className="text-xl font-semibold">This page is for Majestic staff</h1>
        <p className="max-w-md text-sm text-stone-600">
          If this is your booking, show the QR code at the Majestic counter and our staff will scan
          it for you.
        </p>
        <ButtonLink href="/my-bookings" variant="secondary" className="mt-2">
          My bookings
        </ButtonLink>
      </div>
    </PassLayout>
  );
}

function PassLayout({ children }: { children: ReactNode }) {
  return <Container className="max-w-2xl py-8 sm:py-12">{children}</Container>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-stone-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-espresso-900">{value}</dd>
    </div>
  );
}

function customerName({ booking }: PassVerification): string {
  if (booking.customer === null) {
    return '—';
  }
  const fullName = [booking.customer.firstName, booking.customer.lastName]
    .filter((part) => part !== null && part !== '')
    .join(' ');
  return fullName === '' ? booking.customer.email : fullName;
}

function passengerSummary({ booking }: PassVerification): string {
  const parts = [
    { count: booking.adults, singular: 'adult', plural: 'adults' },
    { count: booking.children, singular: 'child', plural: 'children' },
    { count: booking.infants, singular: 'infant', plural: 'infants' },
    { count: booking.guests, singular: 'guest', plural: 'guests' },
  ]
    .filter((part) => part.count > 0)
    .map((part) => `${part.count} ${part.count === 1 ? part.singular : part.plural}`);
  return parts.length === 0 ? '—' : parts.join(', ');
}

function paymentSummary({ booking }: PassVerification): string {
  const paidPayment = booking.payments.find((payment) => payment.status === 'paid');
  if (paidPayment !== undefined) {
    return `Paid online${paidPayment.paidAt === null ? '' : `, ${formatDateTime(paidPayment.paidAt)}`}`;
  }
  if (booking.paymentStatus === 'not_required') {
    if (booking.membership !== null) {
      return `Membership ${booking.membership.serialNo}`;
    }
    if (booking.bankCard !== null) {
      return `Bank card: ${booking.bankCard.name}`;
    }
    return 'Nothing to pay online';
  }
  if (booking.paymentStatus === 'paid') {
    return 'Paid';
  }
  return 'Not paid';
}

function identityDocument(attendee: Attendee): string {
  if (attendee.passportCnic !== null && attendee.passportCnic !== '') {
    return `CNIC/Passport ${attendee.passportCnic}`;
  }
  if (attendee.guardianContact !== null && attendee.guardianContact !== '') {
    return `Guardian ${attendee.guardianContact}`;
  }
  return `Born ${formatDate(attendee.dob)}`;
}
