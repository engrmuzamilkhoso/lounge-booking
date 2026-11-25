import type { EmailContent } from '../mail.service.js';
import { escapeHtml, renderEmailLayout } from './email-layout.js';

export interface InquiryDetails {
  name: string;
  company: string | undefined;
  email: string;
  phone: string | undefined;
  message: string;
}

/** Port of Laravel `emails/inquiry.blade.php` (the `InquiryMail` mailable). */
export function renderInquiryEmail(details: InquiryDetails): EmailContent {
  const rows = [
    { label: 'Name', value: details.name },
    { label: 'Email', value: details.email },
    { label: 'Company', value: details.company ?? '' },
    { label: 'Phone', value: details.phone ?? '' },
    { label: 'Message', value: details.message },
  ]
    .map(
      (row) =>
        `<tr><td style="color:#777;vertical-align:top;padding:6px 12px 6px 0;">${row.label}:</td>` +
        `<td style="padding:6px 0;white-space:pre-wrap;">${escapeHtml(row.value)}</td></tr>`,
    )
    .join('');

  const body = `
    <h2 style="margin:0 0 16px 0;">New Customer Inquiry</h2>
    <table cellpadding="0" cellspacing="0" style="font-size:14px;">${rows}</table>
    <p style="margin-top:24px;">📋 Please respond to this inquiry at your earliest convenience</p>`;
  const footer = `
    This inquiry was submitted through the Majestic Lounge contact form on your website.<br>
    Please follow up with the customer within 24 hours to maintain excellent service standards.`;

  return { subject: 'New Inquiry', html: renderEmailLayout(body, footer) };
}
