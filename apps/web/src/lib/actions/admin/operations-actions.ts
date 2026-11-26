'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiRequest } from '../../api/server-api';
import {
  approveMembershipSchema,
  type ApproveMembershipValues,
  membershipSchema,
  type MembershipValues,
  updateBookingSchema,
  type UpdateBookingValues,
} from '../../validation/admin';
import { type ActionResult, actionFailure, apiFailure, validationFailure } from '../action-result';
import { isValidId, saveRecord } from './save-record';

const INVALID_ID = 'This record cannot be saved.';

// ──────────────────────────────── Bookings ───────────────────────────────

/** Staff correct flight details (passenger counts and price are fixed once booked). */
export async function updateBookingAction(
  id: number,
  values: UpdateBookingValues,
): Promise<ActionResult> {
  const parsed = updateBookingSchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }
  if (!isValidId(id)) {
    return actionFailure(INVALID_ID);
  }
  const booking = parsed.data;
  return saveRecord({
    apiPath: '/admin/bookings',
    id,
    body: {
      flightNumber: booking.flightNumber,
      // An emptied field clears the stored value instead of saving an empty string.
      flightDetail: booking.flightDetail === '' ? null : booking.flightDetail,
      departureDate: booking.departureDate,
      departureTime: booking.departureTime,
    },
    redirectTo: `/admin/bookings/${id}`,
  });
}

export async function removeAttendeeAction(
  bookingId: number,
  attendeeId: number,
): Promise<ActionResult> {
  if (!isValidId(bookingId) || !isValidId(attendeeId)) {
    return actionFailure('This passenger cannot be removed.');
  }
  try {
    await apiRequest<null>(`/admin/bookings/${bookingId}/attendees/${attendeeId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    return apiFailure(error);
  }
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: true, data: undefined };
}

// ────────────────────────────── Memberships ──────────────────────────────

export async function saveMembershipAction(
  id: number | null,
  values: MembershipValues,
): Promise<ActionResult> {
  const parsed = membershipSchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }
  if (!isValidId(id)) {
    return actionFailure(INVALID_ID);
  }
  return saveRecord({
    apiPath: '/admin/memberships',
    id,
    body: parsed.data,
    redirectTo: id === null ? '/admin/memberships' : `/admin/memberships/${id}`,
  });
}

/** Approves an application: assigns its serial number, product and number of visits. */
export async function approveMembershipAction(
  id: number,
  values: ApproveMembershipValues,
): Promise<ActionResult> {
  const parsed = approveMembershipSchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }
  if (!isValidId(id)) {
    return actionFailure(INVALID_ID);
  }
  try {
    await apiRequest<unknown>(`/admin/memberships/${id}/approve`, {
      method: 'POST',
      body: parsed.data,
    });
  } catch (error) {
    return apiFailure(error);
  }
  revalidatePath('/admin/memberships');
  redirect(`/admin/memberships/${id}?notice=approved`);
}
