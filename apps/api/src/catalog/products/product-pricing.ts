/**
 * The booking price rule lives in @booking/shared-types so the API (which charges it) and the
 * website (which shows it) always use the same calculation.
 */
export {
  calculateBookingTotal,
  type PassengerCounts,
  type ProductPrices,
} from '@booking/shared-types';
