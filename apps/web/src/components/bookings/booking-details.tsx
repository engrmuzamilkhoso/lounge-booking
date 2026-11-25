import { AttendeeType } from '@booking/shared-types';
import { Plane, UsersRound } from 'lucide-react';
import type { Booking } from '@/lib/api/types';
import { formatDate, formatTime } from '@/lib/format';

const typeLabel: Record<AttendeeType, string> = {
  [AttendeeType.Adult]: 'Adult',
  [AttendeeType.Child]: 'Child',
  [AttendeeType.Infant]: 'Infant',
};

/** Flight and passenger details of a booking, used at checkout and on the booking page. */
export function BookingDetails({ booking }: { booking: Booking }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-card border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Plane aria-hidden className="size-5 text-gold-600" />
          Flight
        </h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <Detail label="Flight number" value={booking.flightNumber} />
          <Detail label="Departure date" value={formatDate(booking.departureDate)} />
          <Detail label="Departure time" value={formatTime(booking.departureTime)} />
          {booking.bankCard !== null && <Detail label="Bank card" value={booking.bankCard.name} />}
          {booking.membership !== null && (
            <Detail label="Membership" value={booking.membership.serialNo} />
          )}
        </dl>
      </section>

      <section className="rounded-card border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <UsersRound aria-hidden className="size-5 text-gold-600" />
          Passengers
        </h2>
        <ul className="mt-4 divide-y divide-stone-100">
          {booking.attendees.map((attendee) => (
            <li
              key={attendee.id}
              className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-medium text-espresso-900">{attendee.name}</span>
              <span className="text-stone-500">
                {typeLabel[attendee.type]} · born {formatDate(attendee.dob)}
                {attendee.nationality !== null && ` · ${attendee.nationality}`}
              </span>
            </li>
          ))}
        </ul>
        {booking.guests > 0 && (
          <p className="mt-2 text-sm text-stone-600">
            Plus {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}.
          </p>
        )}
      </section>
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
