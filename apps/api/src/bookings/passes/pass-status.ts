import { BookingPaymentStatus, PassStatus } from '@booking/shared-types';
import { formatDateOnly } from '../../common/date-only.js';

/** A pass stays valid until the end of the day after departure (late-night and delayed flights). */
const GRACE_DAYS_AFTER_DEPARTURE = 1;

export interface PassFacts {
  deletedAt: Date | null;
  paymentStatus: string;
  checkedInAt: Date | null;
  departureDate: Date;
}

/**
 * Decides whether a booking's pass lets the customer in. Checked in this order, so staff see
 * the most important reason first: cancelled, already used, unpaid, expired.
 *
 * @param today today's date in Pakistan, "YYYY-MM-DD"
 */
export function passStatusFor(booking: PassFacts, today: string): PassStatus {
  if (booking.deletedAt !== null) {
    return PassStatus.Cancelled;
  }
  if (booking.checkedInAt !== null) {
    return PassStatus.AlreadyUsed;
  }
  if (!isSettled(booking.paymentStatus)) {
    return PassStatus.PaymentRequired;
  }
  if (lastValidDay(booking.departureDate) < today) {
    return PassStatus.Expired;
  }
  return PassStatus.Valid;
}

/** Paid online, or nothing to pay (free bookings and bookings settled offline). */
export function isSettled(paymentStatus: string): boolean {
  return (
    paymentStatus === BookingPaymentStatus.Paid ||
    paymentStatus === BookingPaymentStatus.NotRequired
  );
}

function lastValidDay(departureDate: Date): string {
  const lastDay = new Date(departureDate);
  lastDay.setUTCDate(lastDay.getUTCDate() + GRACE_DAYS_AFTER_DEPARTURE);
  return formatDateOnly(lastDay);
}
