import type { ProductPrices } from '@booking/shared-types';
import type { Product } from '../api/types';

/** The pricing fields of a product in the shape the shared price rule expects. */
export function pricesOf(product: Product): ProductPrices {
  return {
    adultPrice: product.price ?? 0,
    childPrice: product.childPrice,
    childLimit: product.childLimit,
    infantPrice: product.infantPrice,
    infantLimit: product.infantLimit,
    guestPrice: product.guestPrice ?? 0,
  };
}

/** Age bands shown next to the passenger counters (from the existing website). */
export const passengerBands = {
  adults: 'Adults',
  adultsHint: '10 years and over',
  children: 'Children',
  childrenHint: '3 to 10 years',
  infants: 'Infants',
  infantsHint: 'Under 3 years',
  guests: 'Guests',
  guestsHint: 'Accompanying guests',
} as const;

export const MAX_PASSENGERS_PER_TYPE = 20;
