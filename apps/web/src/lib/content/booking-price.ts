import 'server-only';
import { type PriceLine, priceBreakdown } from '@booking/shared-types';
import { ApiError } from '../api/api-error';
import { apiRequest } from '../api/server-api';
import type { Booking, Product } from '../api/types';
import { pricesOf } from './product-prices';

/**
 * Price lines for an existing booking. The booking's stored total is what is charged; the line
 * breakdown is rebuilt from the product's prices and only shown when it adds up to that total
 * (prices may have changed since the booking was made).
 */
export async function bookingPriceLines(booking: Booking): Promise<PriceLine[]> {
  const total = booking.totalAmount ?? 0;
  const fallback: PriceLine[] = [
    { label: 'Booking total', quantity: 1, unitPrice: total, amount: total },
  ];
  if (booking.product === null) {
    return fallback;
  }

  let product: Product;
  try {
    product = await apiRequest<Product>(`/products/${booking.product.id}`);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) {
      return fallback;
    }
    throw error;
  }

  const lines = priceBreakdown(pricesOf(product), {
    adults: booking.adults,
    children: booking.children,
    infants: booking.infants,
    guests: booking.guests,
  });
  const linesTotal = lines.reduce((sum, line) => sum + line.amount, 0);
  return linesTotal === total ? lines : fallback;
}
