import type { PassStatus } from '@booking/shared-types';
import type { BookingResponse } from '../booking-response.js';

/** What staff see after scanning a pass. */
export interface PassVerificationResponse {
  /** `valid` means the customer may be let in; anything else says why not. */
  status: PassStatus;
  /** True when the departure date is today (Pakistan time); otherwise staff should check. */
  departsToday: boolean;
  checkedInAt: string | null;
  checkedInBy: { id: number; name: string } | null;
  booking: BookingResponse;
}
