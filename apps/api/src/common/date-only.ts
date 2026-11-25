/**
 * Calendar dates without a time (date of birth, flight date) are stored in PostgreSQL `date`
 * columns. Prisma represents them as a JavaScript Date at 00:00 UTC, so they are always
 * converted in UTC here; converting in local time could shift them by one day.
 */

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-07-09" → Date at 2026-07-09T00:00:00Z */
export function parseDateOnly(value: string): Date {
  if (!DATE_ONLY_PATTERN.test(value)) {
    throw new Error(`Expected a YYYY-MM-DD date, received "${value}"`);
  }
  return new Date(`${value}T00:00:00.000Z`);
}

/** Date at 00:00 UTC → "2026-07-09" */
export function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** Today's date in Pakistan (flight dates are local), as "YYYY-MM-DD". */
export function todayInPakistan(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
}
