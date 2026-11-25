'use server';

import { redirect } from 'next/navigation';
import { apiRequest } from '../api/server-api';
import { type ActionResult, apiFailure } from './action-result';

interface CheckoutSession {
  checkoutUrl: string;
  amount: number;
  currency: string;
}

/**
 * "Pay now": asks the API for the Safepay checkout of this booking and sends the customer there.
 * The API decides the amount from the stored booking; nothing about the price is sent from here.
 */
export async function startPaymentAction(bookingId: number): Promise<ActionResult> {
  let session: CheckoutSession;
  try {
    session = await apiRequest<CheckoutSession>(`/bookings/${bookingId}/checkout`, {
      method: 'POST',
    });
  } catch (error) {
    return apiFailure(error);
  }

  const checkoutUrl = new URL(session.checkoutUrl);
  const isSafepayHost =
    checkoutUrl.protocol === 'https:' && checkoutUrl.hostname.endsWith('getsafepay.com');
  if (!isSafepayHost) {
    // Defence in depth: never redirect customers anywhere but Safepay from here.
    return {
      ok: false,
      message: 'The payment page could not be opened. Please try again.',
      fieldErrors: {},
    };
  }
  redirect(session.checkoutUrl);
}
