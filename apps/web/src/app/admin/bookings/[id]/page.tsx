import { AttendeeType, PassStatus, passVerificationPath } from '@booking/shared-types';
import { Pencil, QrCode } from 'lucide-react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AccessDenied } from '@/components/admin/access-denied';
import { DeleteButton } from '@/components/admin/delete-button';
import { Notice } from '@/components/admin/notice';
import { PageHeader } from '@/components/admin/page-header';
import { PaymentStatusBadge } from '@/components/bookings/payment-status-badge';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { getAdminAccess, resourcePermissions } from '@/lib/admin/access';
import { getRecordOrNotFound, idParam } from '@/lib/admin/queries';
import type { Attendee, Booking, PaymentSummary } from '@/lib/api/types';
import { displayName } from '@/lib/auth/current-user';
import { formatDate, formatDateTime, formatRupees, formatTime } from '@/lib/format';
import { RemoveAttendeeButton } from './remove-attendee-button';

export const metadata: Metadata = { title: 'Booking' };

const attendeeTypeLabel: Record<AttendeeType, string> = {
  [AttendeeType.Adult]: 'Adult',
  [AttendeeType.Child]: 'Child',
  [AttendeeType.Infant]: 'Infant',
};

const passBadge: Record<PassStatus, { label: string; tone: BadgeTone }> = {
  [PassStatus.Valid]: { label: 'Not used yet', tone: 'success' },
  [PassStatus.AlreadyUsed]: { label: 'Used', tone: 'neutral' },
  [PassStatus.PaymentRequired]: { label: 'Awaiting payment', tone: 'warning' },
  [PassStatus.Expired]: { label: 'Expired', tone: 'neutral' },
  [PassStatus.Cancelled]: { label: 'Cancelled', tone: 'danger' },
};

const paymentLabel: Record<PaymentSummary['status'], string> = {
  pending: 'Started',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export default async function AdminBookingPage({
  params,
  searchParams,
}: PageProps<'/admin/bookings/[id]'>) {
  const { permissions } = await getAdminAccess('/admin/bookings');
  const can = resourcePermissions(permissions, 'booking');
  if (!can.canShow) {
    return <AccessDenied />;
  }
  const { id } = await params;
  const { notice } = await searchParams;
  const booking = await getRecordOrNotFound<Booking>(`/admin/bookings/${idParam(id)}`);
  const canRemovePassengers = permissions.has('booking_detail_delete');

  return (
    <>
      <PageHeader
        title={`Booking ${booking.code}`}
        description={
          booking.createdAt === null ? undefined : `Booked on ${formatDateTime(booking.createdAt)}`
        }
        back={{ href: '/admin/bookings', label: 'Bookings' }}
        actions={
          <>
            {booking.pass !== null && (
              <ButtonLink
                href={passVerificationPath(booking.pass.token)}
                variant="secondary"
                icon={<QrCode aria-hidden className="size-4" />}
              >
                Pass &amp; check-in
              </ButtonLink>
            )}
            {can.canEdit && (
              <ButtonLink
                href={`/admin/bookings/${booking.id}/edit`}
                icon={<Pencil aria-hidden className="size-4" />}
              >
                Edit
              </ButtonLink>
            )}
            {can.canDelete && (
              <DeleteButton
                resource="bookings"
                id={booking.id}
                label={`booking ${booking.code}`}
                redirectTo="/admin/bookings?notice=deleted"
              />
            )}
          </>
        }
      />
      <Notice notice={notice} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Section title="Flight">
            <Details>
              <Detail label="Service" value={booking.service.name} />
              <Detail label="Product" value={booking.product?.name ?? '—'} />
              <Detail label="Category" value={booking.category?.name ?? '—'} />
              <Detail label="Flight number" value={booking.flightNumber} />
              <Detail label="Flight details" value={booking.flightDetail ?? '—'} />
              <Detail
                label="Departure"
                value={`${formatDate(booking.departureDate)}, ${formatTime(booking.departureTime)}`}
              />
              <Detail label="Source" value={booking.source?.name ?? '—'} />
              {booking.bankCard !== null && (
                <Detail label="Bank card" value={booking.bankCard.name} />
              )}
              {booking.membership !== null && (
                <Detail label="Membership" value={booking.membership.serialNo} />
              )}
            </Details>
          </Section>

          <Section title={`Passengers (${booking.attendees.length})`}>
            <ul className="divide-y divide-stone-100">
              {booking.attendees.map((attendee) => (
                <li key={attendee.id} className="flex items-start justify-between gap-4 py-3">
                  <AttendeeSummary attendee={attendee} />
                  {canRemovePassengers && booking.attendees.length > 1 && (
                    <RemoveAttendeeButton
                      bookingId={booking.id}
                      attendeeId={attendee.id}
                      name={attendee.name}
                    />
                  )}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <div className="flex flex-col gap-6">
          <Section title="Customer">
            {booking.customer === null ? (
              <p className="text-sm text-stone-500">No customer account linked.</p>
            ) : (
              <Details single>
                <Detail label="Name" value={displayName(booking.customer)} />
                <Detail label="Email" value={booking.customer.email} />
              </Details>
            )}
          </Section>

          <Section title="Payment">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-2xl font-semibold">
                {formatRupees(booking.totalAmount ?? 0)}
              </span>
              <PaymentStatusBadge status={booking.paymentStatus} />
            </div>
            <p className="text-sm text-stone-600">
              {booking.adults} adult(s), {booking.children} child(ren), {booking.infants} infant(s),{' '}
              {booking.guests} guest(s)
            </p>
            {booking.payments.length > 0 && (
              <ul className="mt-4 divide-y divide-stone-100 border-t border-stone-100 text-sm">
                {booking.payments.map((payment) => (
                  <li key={payment.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <Badge tone={payment.status === 'paid' ? 'success' : 'neutral'}>
                        {paymentLabel[payment.status]}
                      </Badge>
                      <span>{formatRupees(payment.amount)}</span>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">
                      {formatDateTime(payment.paidAt ?? payment.createdAt)} ·{' '}
                      {payment.paymentMethod ?? payment.gateway}
                    </p>
                    <p className="font-mono text-xs break-all text-stone-500">
                      {payment.reference}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Lounge pass">
            {booking.pass === null ? (
              <p className="text-sm text-stone-500">Issued once the booking is paid.</p>
            ) : (
              <div className="flex flex-col gap-2 text-sm">
                <Badge tone={passBadge[booking.pass.status].tone} className="self-start">
                  {passBadge[booking.pass.status].label}
                </Badge>
                {booking.pass.checkedInAt !== null && (
                  <p className="text-stone-600">
                    Checked in {formatDateTime(booking.pass.checkedInAt)}
                  </p>
                )}
              </div>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}

function AttendeeSummary({ attendee }: { attendee: Attendee }) {
  const lines = [
    `${attendeeTypeLabel[attendee.type]} · born ${formatDate(attendee.dob)}`,
    attendee.nationality,
    attendee.passportCnic === null
      ? null
      : `CNIC/Passport ${attendee.passportCnic}${
          attendee.passportCnicExpiry === null
            ? ''
            : ` (expires ${formatDate(attendee.passportCnicExpiry)})`
        }`,
    attendee.contactNo,
    attendee.email,
    attendee.guardianContact === null ? null : `Guardian ${attendee.guardianContact}`,
    attendee.address,
  ].filter((line) => line !== null && line !== '');

  return (
    <div className="text-sm">
      <p className="font-medium text-espresso-900">{attendee.name}</p>
      {lines.map((line) => (
        <p key={line} className="text-stone-600">
          {line}
        </p>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-stone-200 bg-white p-6 shadow-card">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Details({ children, single = false }: { children: ReactNode; single?: boolean }) {
  return (
    <dl
      className={single ? 'grid gap-4 text-sm' : 'grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3'}
    >
      {children}
    </dl>
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
