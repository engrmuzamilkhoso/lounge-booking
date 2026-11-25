import type { Prisma } from '../generated/prisma/client.js';

/**
 * Money columns are numeric(15,2) or whole-rupee integers. The API returns every amount as a
 * plain JSON number (PKR); amounts here are far below the range where numbers lose precision.
 */
export function decimalToNumber(value: Prisma.Decimal): number {
  return value.toNumber();
}

export function nullableDecimalToNumber(value: Prisma.Decimal | null): number | null {
  if (value === null) {
    return null;
  }
  return value.toNumber();
}
