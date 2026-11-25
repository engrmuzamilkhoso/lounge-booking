'use server';

import { BookingPaymentStatus } from '@booking/shared-types';
import { redirect } from 'next/navigation';
import { apiRequest } from '../api/server-api';
import type { Booking, MembershipVerification } from '../api/types';
import { bookingFormSchema, type BookingFormValues, toApiPassenger } from '../validation/booking';
import { type ActionResult, apiFailure, validationFailure } from './action-result';

export async function verifyMembershipAction(
  serialNo: string,
): Promise<ActionResult<MembershipVerification>> {
  const trimmed = serialNo.trim();
  if (trimmed === '') {
    return {
      ok: false,
      message: 'Enter your membership number.',
      fieldErrors: { serialNo: 'Enter your membership number.' },
    };
  }
  try {
    const verification = await apiRequest<MembershipVerification>('/memberships/verify', {
      method: 'POST',
      body: { serialNo: trimmed },
    });
    return { ok: true, data: verification };
  } catch (error) {
    return apiFailure(error);
  }
}

/**
 * Places the booking. The API recalculates the price and rejects it if it differs from what
 * the customer saw. Bookings with a price continue to checkout; free ones are confirmed.
 *
 * `idempotencyKey` is created once per form, so a double click or a retry after a network
 * error returns the same booking instead of creating a second one.
 */
export async function createBookingAction(
  values: BookingFormValues,
  idempotencyKey: string,
): Promise<ActionResult> {
  const parsed = bookingFormSchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  let booking: Booking;
  try {
    booking = await apiRequest<Booking>('/bookings', {
      method: 'POST',
      body: {
        ...parsed.data,
        attendees: parsed.data.attendees.map(toApiPassenger),
        platform: 'web',
      },
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  } catch (error) {
    return apiFailure(error);
  }

  if (booking.paymentStatus === BookingPaymentStatus.Pending) {
    redirect(`/checkout/${booking.id}`);
  }
  redirect(`/my-bookings/${booking.id}?placed=1`);
}
