/**
 * Reads what staff scanned or typed at the counter.
 *
 * - A USB / Bluetooth QR scanner behaves like a keyboard: it types the QR code's text (the pass
 *   URL, e.g. https://…/staff/pass/<token>) and presses Enter.
 * - The camera scanner gives the same text.
 * - Staff can also type a booking reference such as ML0000201.
 *
 * The pass token (64 lowercase hex characters) is looked for anywhere in the text, so a scan
 * still works when a scanner set to another keyboard layout garbles ":" or "/" in the URL.
 */
export type ScanInput =
  | { kind: 'pass'; token: string }
  | { kind: 'bookingCode'; code: string }
  | { kind: 'unrecognised' };

const PASS_TOKEN_ANYWHERE = /[0-9a-f]{64}/;
const BOOKING_CODE = /^[A-Za-z0-9-]{1,255}$/;

export function readScanInput(rawValue: string): ScanInput {
  const value = rawValue.trim();
  const token = PASS_TOKEN_ANYWHERE.exec(value.toLowerCase())?.[0];
  if (token !== undefined) {
    return { kind: 'pass', token };
  }
  if (BOOKING_CODE.test(value)) {
    return { kind: 'bookingCode', code: value.toUpperCase() };
  }
  return { kind: 'unrecognised' };
}

/** The admin page that verifies a pass. */
export function adminPassPath(token: string): string {
  return `/admin/passes/${token}`;
}
