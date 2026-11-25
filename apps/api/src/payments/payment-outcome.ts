import { BookingPaymentStatus, PaymentStatus } from '@booking/shared-types';

/**
 * What a Safepay tracker state means for the payment. Only Safepay's own report decides
 * whether money was taken; redirects and webhook bodies are never trusted on their own.
 *
 * - TRACKER_ENDED: payment completed (Safepay docs: "the payment succeeded").
 * - TRACKER_PARTIAL_REFUND: completed, part of it refunded — still paid.
 * - TRACKER_REFUNDED: fully refunded.
 * - TRACKER_REVERSED / TRACKER_VOIDED: authorisation released, nothing captured.
 * - Anything else (TRACKER_STARTED, TRACKER_ENROLLED, TRACKER_AUTHORIZED, …): not finished.
 */
export type GatewayOutcome = 'paid' | 'refunded' | 'cancelled' | 'in_progress';

export function outcomeOfTrackerState(state: string): GatewayOutcome {
  switch (state) {
    case 'TRACKER_ENDED':
    case 'TRACKER_PARTIAL_REFUND':
      return 'paid';
    case 'TRACKER_REFUNDED':
      return 'refunded';
    case 'TRACKER_REVERSED':
    case 'TRACKER_VOIDED':
      return 'cancelled';
    default:
      return 'in_progress';
  }
}

/** The payment-attempt status after applying a gateway outcome (null = no change). */
export function nextPaymentStatus(
  current: PaymentStatus,
  outcome: GatewayOutcome,
  failureReported: boolean,
): PaymentStatus | null {
  switch (outcome) {
    case 'paid':
      // A customer may retry on Safepay's page after a failed card, so failed/cancelled → paid
      // is allowed. Refunded is final.
      return current === PaymentStatus.Paid || current === PaymentStatus.Refunded
        ? null
        : PaymentStatus.Paid;
    case 'refunded':
      return current === PaymentStatus.Refunded ? null : PaymentStatus.Refunded;
    case 'cancelled':
      return current === PaymentStatus.Pending || current === PaymentStatus.Failed
        ? PaymentStatus.Cancelled
        : null;
    case 'in_progress':
      // A `payment.failed` webhook for a session that is still open marks the attempt failed;
      // the customer can try again.
      return failureReported && current === PaymentStatus.Pending ? PaymentStatus.Failed : null;
  }
}

/** The booking's payment status that mirrors a payment attempt's status. */
export function bookingStatusFor(paymentStatus: PaymentStatus): BookingPaymentStatus {
  switch (paymentStatus) {
    case PaymentStatus.Paid:
      return BookingPaymentStatus.Paid;
    case PaymentStatus.Refunded:
      return BookingPaymentStatus.Refunded;
    case PaymentStatus.Failed:
    case PaymentStatus.Cancelled:
      return BookingPaymentStatus.Failed;
    case PaymentStatus.Pending:
      return BookingPaymentStatus.Pending;
  }
}

/** Whole rupees (how booking totals are stored) → paisa (what Safepay expects). */
export function rupeesToPaisa(rupees: number): number {
  return Math.round(rupees * 100);
}
