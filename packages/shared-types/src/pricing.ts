/**
 * Booking price rule, ported from the Laravel website (`public/front_assets/js/main.js`,
 * `calculateTotalPrice`). Shared by the API (which charges it) and the website (which shows it),
 * so the two can never disagree.
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

export interface PriceLine {
  label: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  /** e.g. "2 free" when part of the quantity is included at no charge. */
  note?: string;
}

/** Line-by-line breakdown, for showing the customer how the total is made up. */
export function priceBreakdown(prices: ProductPrices, counts: PassengerCounts): PriceLine[] {
  const lines: PriceLine[] = [];

  if (counts.adults > 0) {
    lines.push({
      label: 'Adults',
      quantity: counts.adults,
      unitPrice: prices.adultPrice,
      amount: counts.adults * prices.adultPrice,
    });
  }
  if (counts.children > 0) {
    lines.push(chargeableLine('Children', counts.children, prices.childLimit, prices.childPrice));
  }
  if (counts.infants > 0) {
    lines.push(chargeableLine('Infants', counts.infants, prices.infantLimit, prices.infantPrice));
  }
  if (counts.guests > 0) {
    lines.push({
      label: 'Guests',
      quantity: counts.guests,
      unitPrice: prices.guestPrice,
      amount: counts.guests * prices.guestPrice,
    });
  }
  return lines;
}

export function calculateBookingTotal(prices: ProductPrices, counts: PassengerCounts): number {
  return priceBreakdown(prices, counts).reduce((total, line) => total + line.amount, 0);
}

function chargeableLine(
  label: string,
  quantity: number,
  freeAllowance: number,
  unitPrice: number,
): PriceLine {
  const freeCount = Math.min(quantity, freeAllowance);
  const chargeableCount = quantity - freeCount;
  return {
    label,
    quantity,
    unitPrice,
    amount: chargeableCount * unitPrice,
    note: freeCount > 0 ? `${freeCount} free` : undefined,
  };
}
