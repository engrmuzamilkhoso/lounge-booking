/**
 * Booking reference: "ML" + booking id padded to 7 digits (e.g. id 201 → "ML0000201"),
 * the format every imported Laravel booking follows.
 *
 * Laravel derived it from "last booking id + 1" before inserting, which produced duplicate
 * codes. Here the id is reserved from the database sequence first, so id and code always
 * match and cannot collide.
 */
const CODE_PREFIX = 'ML';
const CODE_DIGITS = 7;

export function formatBookingCode(bookingId: number): string {
  return CODE_PREFIX + bookingId.toString().padStart(CODE_DIGITS, '0');
}
