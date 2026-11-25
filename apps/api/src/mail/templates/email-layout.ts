const LOGO_URL = 'https://majestic.com.pk/public/Footer_Logo.png';
const BRAND_COLOR = '#1a1a2e';

/** Escapes user-supplied text before it is placed into email HTML. */
export function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Shared header/footer for all emails, matching the Laravel templates
 * (logo + "Majestic Lounge" header, content, grey footer note).
 * `bodyHtml` must already be escaped.
 */
export function renderEmailLayout(bodyHtml: string, footerHtml: string): string {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:${BRAND_COLOR};padding:20px;text-align:center;">
          <img src="${LOGO_URL}" alt="Majestic Lounge" height="40" style="vertical-align:middle;">
          <span style="color:#ffffff;font-size:20px;font-weight:bold;margin-left:8px;vertical-align:middle;">Majestic Lounge</span>
        </td></tr>
        <tr><td style="padding:32px 32px 24px 32px;font-size:15px;line-height:1.6;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="background:#f8f8fa;padding:20px 32px;font-size:12px;color:#777;line-height:1.5;">
          ${footerHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
