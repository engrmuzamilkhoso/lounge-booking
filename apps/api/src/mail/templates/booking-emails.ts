import type { EmailContent } from '../mail.service.js';
import { escapeHtml, renderEmailLayout } from './email-layout.js';

export interface BookingConfirmationDetails {
  customerName: string;
  code: string;
  adults: number;
  children: number;
  infants: number;
}

/**
 * Port of Laravel `emails/order.blade.php` (the `orderMail` mailable): sent to staff and the
 * customer when a booking is placed. Only passenger types with at least one person are listed.
 */
export function renderBookingConfirmationEmail(details: BookingConfirmationDetails): EmailContent {
  const quantityRows = [
    { label: 'Adults', count: details.adults },
    { label: 'Children', count: details.children },
    { label: 'Infants', count: details.infants },
  ]
    .filter((row) => row.count > 0)
    .map((row) => `<tr><td>${row.label}</td><td>${row.count}</td></tr>`)
    .join('');

  const body = `
    <h3 style="margin:0 0 16px 0;">Dear, ${escapeHtml(details.customerName)}!</h3>
    <p>Congratulations! Your booking has been successfully placed!</p>
    <p>Your booking details are as follows:</p>
    <table border="1" cellpadding="5" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:14px;">
      <thead>
        <tr><th align="left">Order no</th><th align="left">${escapeHtml(details.code)}</th></tr>
        <tr><th align="left">Category</th><th align="left">Quantity</th></tr>
      </thead>
      <tbody>${quantityRows}</tbody>
    </table>
    <p>If you have any questions, feel free to contact us at contact@majestic.com.pk</p>`;

  return {
    subject: 'Majestic Booking detail',
    html: renderEmailLayout(body, 'Thank you for choosing Majestic Lounge.'),
  };
}
