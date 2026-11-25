/** Display formatting shared by all pages (Pakistan locale and time zone). */

const rupees = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });

export function formatRupees(amount: number): string {
  return `PKR ${rupees.format(amount)}`;
}

/** "2027-03-15" → "15 Mar 2027" (date-only values have no time zone). */
export function formatDate(dateOnly: string): string {
  const [year, month, day] = dateOnly.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    return dateOnly;
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** "22:50" → "10:50 PM" */
export function formatTime(timeOfDay: string | null): string {
  if (timeOfDay === null) {
    return '—';
  }
  const [hours, minutes] = timeOfDay.split(':').map(Number);
  if (hours === undefined || minutes === undefined) {
    return timeOfDay;
  }
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

/** ISO timestamp → "15 Mar 2027, 10:50 PM" in Pakistan time. */
export function formatDateTime(isoTimestamp: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Karachi',
  }).format(new Date(isoTimestamp));
}
