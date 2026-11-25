/**
 * Booking price rule, ported from the Laravel website (`public/front_assets/js/main.js`,
 * `calculateTotalPrice`). Laravel only ran it in the browser; the API now runs the same rule.
 *
 *   total = adults × adult price
 *         + (children beyond the free child allowance) × child price
 *         + (infants beyond the free infant allowance) × infant price
 *         + guests × guest price
 *
 * `adultLimit` is not part of the rule (it was not used by Laravel either).
 */
export interface ProductPrices {
  adultPrice: number;
  childPrice: number;
  childLimit: number;
  infantPrice: number;
  infantLimit: number;
  guestPrice: number;
}

export interface PassengerCounts {
  adults: number;
  children: number;
  infants: number;
  guests: number;
}

export function calculateBookingTotal(prices: ProductPrices, counts: PassengerCounts): number {
  const chargeableChildren = Math.max(0, counts.children - prices.childLimit);
  const chargeableInfants = Math.max(0, counts.infants - prices.infantLimit);

  const adultsTotal = counts.adults * prices.adultPrice;
  const childrenTotal = chargeableChildren * prices.childPrice;
  const infantsTotal = chargeableInfants * prices.infantPrice;
  const guestsTotal = counts.guests * prices.guestPrice;

  return adultsTotal + childrenTotal + infantsTotal + guestsTotal;
}
