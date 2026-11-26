import { AttendeeType, PassStatus } from '@booking/shared-types';
import { CircleCheck, CircleX, History } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AccessDenied } from '@/components/admin/access-denied';
import { CheckInButton } from '@/components/passes/check-in-button';
import { PassScanField } from '@/components/passes/pass-scan-field';
import { Alert } from '@/components/ui/alert';
import { getAdminAccess } from '@/lib/admin/access';
import { ApiError } from '@/lib/api/api-error';
import { apiRequest } from '@/lib/api/server-api';
import type { Attendee, PassVerification } from '@/lib/api/types';
import { displayName } from '@/lib/auth/current-user';
import { formatDate, formatDateTime, formatTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Verify pass' };

const attendeeTypeLabel: Record<AttendeeType, string> = {
  [AttendeeType.Adult]: 'Adult',
  [AttendeeType.Child]: 'Child',
  [AttendeeType.Infant]: 'Infant',
};

/**
 * The verdict for one pass: whether to let the customer in, the passengers to check against
 * their ID, and the Check-in button. The scan box stays at the top so the next customer can be
 * scanned straight away.
 */
export default async function VerifyPassPage({ params }: PageProps<'/admin/passes/[token]'>) {
  const { token } = await params;
  const { permissions } = await getAdminAccess(`/admin/passes/${token}`);
  if (!permissions.has('booking_show')) {
    return <AccessDenied />;
  }

  let verification: PassVerification | null = null;
  try {
    verification = await apiRequest<PassVerification>(
      `/admin/booking-passes/${encodeURIComponent(token)}`,
    );
  } catch (error) {
    if (!(error instanceof ApiError && error.isNotFound)) {
      throw error;
    }
  }

  return (
    <div className="max-w-3xl">
      <section className="mb-6 rounded-card border border-stone-200 bg-white p-4 shadow-card">
        <PassScanField />
      </section>

      {verification === null ? (
        <Verdict
          tone="refused"
          icon={<CircleX aria-hidden className="size-10" />}
          title="Pass not recognised"
          description="This QR code does not belong to any booking. Do not let the customer in; ask for the booking reference instead."
        />
      ) : (
        <PassDetails
          verification={verification}
          token={token}
          canCheckIn={permissions.has('booking_edit')}
          canOpenBooking={permissions.has('booking_show')}
        />
      )}
    </div>
  );
}

function PassDetails({
  verification,
  token,
  canCheckIn,
  canOpenBooking,
}: {
  verification: PassVerification;
  token: string;
  canCheckIn: boolean;
  canOpenBooking: boolean;
}) {
  const { booking } = verification;
  const isValid = verification.status === PassStatus.Valid;

  return (
    <>
      <PassVerdict verification={verification} />

      {isValid && !verification.departsToday && (
        <Alert tone="warning" title="Departure is not today" className="mt-4">
          This booking departs on {formatDate(booking.departureDate)}. Check with the customer
          before letting them in.
        </Alert>
      )}

      {isValid && canCheckIn && (
        <div className="mt-6">
          <CheckInButton passToken={token} />
        </div>
      )}
      {isValid && !canCheckIn && (
        <Alert tone="info" className="mt-6">
          Your role can verify passes but not check them in. Ask a colleague with the booking_edit
          permission.
        </Alert>
      )}

      <section className="mt-6 rounded-card border border-stone-200 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Booking {booking.code}</h2>
          {canOpenBooking && (
            <Link
              href={`/admin/bookings/${booking.id}`}
              className="text-sm font-medium text-gold-600 hover:underline"
            >
              Open booking
            </Link>
          )}
        </div>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <Detail
            label="Service"
            value={[booking.service.name, booking.product?.name]
              .filter((part) => part !== undefined && part !== null)
              .join(' · ')}
          />
          <Detail
            label="Customer"
            value={booking.customer === null ? '—' : displayName(booking.customer)}
          />
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
    </>
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
      <h1 className="text-2xl font-bold tracking-wide uppercase sm:text-3xl">{title}</h1>
      <p className="max-w-lg text-sm sm:text-base">{description}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-stone-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-espresso-900">{value}</dd>
    </div>
  );
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
