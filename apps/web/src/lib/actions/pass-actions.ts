'use server';

import { passVerificationPath } from '@booking/shared-types';
import { redirect } from 'next/navigation';
import { ApiError } from '../api/api-error';
import { apiRequest } from '../api/server-api';
import type { PassVerification } from '../api/types';
import { type ActionResult, actionFailure, apiFailure } from './action-result';

const PASS_TOKEN_PATTERN = /^[0-9a-f]{64}$/;
const BOOKING_CODE_PATTERN = /^[A-Za-z0-9-]{1,255}$/;

/** Staff: let the customer in. The API refuses passes that are used, unpaid or expired. */
export async function checkInPassAction(passToken: string): Promise<ActionResult> {
  if (!PASS_TOKEN_PATTERN.test(passToken)) {
    return actionFailure('This pass is not recognised.');
  }
  try {
    await apiRequest<PassVerification>(`/admin/booking-passes/${passToken}/check-in`, {
      method: 'POST',
    });
  } catch (error) {
    return apiFailure(error);
  }
  return { ok: true, data: undefined };
}

/** Staff: find a pass by booking reference (when the QR code cannot be scanned). */
export async function findPassByCodeAction(bookingCode: string): Promise<ActionResult> {
  const code = bookingCode.trim().toUpperCase();
  if (!BOOKING_CODE_PATTERN.test(code)) {
    return actionFailure('Enter a booking reference such as ML0000201.', {
      code: 'Enter a booking reference such as ML0000201.',
    });
  }

  let verification: PassVerification;
  try {
    verification = await apiRequest<PassVerification>(
      `/admin/booking-passes?code=${encodeURIComponent(code)}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) {
      return actionFailure(`No booking found with reference ${code}.`, {
        code: `No booking found with reference ${code}.`,
      });
    }
    return apiFailure(error);
  }

  if (verification.booking.pass === null) {
    // Unpaid bookings have no pass token yet; staff still need to see why it is refused.
    return actionFailure(`Booking ${code} has not been paid yet, so it has no pass.`, {
      code: `Booking ${code} has not been paid yet, so it has no pass.`,
    });
  }
  redirect(passVerificationPath(verification.booking.pass.token));
}
