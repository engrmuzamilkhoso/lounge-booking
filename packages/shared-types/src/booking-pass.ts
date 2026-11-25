/**
 * Verdict for a lounge pass (the QR code a customer shows at the counter).
 *
 * - valid: the booking is settled and has not been used yet — staff may let the customer in.
 * - already_used: staff already checked this pass in (a pass is single-use).
 * - payment_required: the booking still has to be paid online.
 * - expired: the departure date is more than one day in the past.
 * - cancelled: the booking was deleted.
 */
export const PassStatus = {
  Valid: 'valid',
  AlreadyUsed: 'already_used',
  PaymentRequired: 'payment_required',
  Expired: 'expired',
  Cancelled: 'cancelled',
} as const;
export type PassStatus = (typeof PassStatus)[keyof typeof PassStatus];

/** Path of the staff verification page; the QR code holds `<website URL><path>`. */
export function passVerificationPath(passToken: string): string {
  return `/staff/pass/${passToken}`;
}
