import type { EmailContent } from '../mail.service.js';
import { escapeHtml, renderEmailLayout } from './email-layout.js';

/** Port of Laravel `emails/Otp.blade.php`. */
export function renderOtpEmail(otp: string, expiresInMinutes: number): EmailContent {
  const body = `
    <h2 style="margin:0 0 8px 0;">Verification Code</h2>
    <p style="margin:0 0 24px 0;">Enter the code below to verify your identity and secure your account</p>
    <p style="margin:0;color:#777;">Your OTP Code</p>
    <p style="margin:4px 0 16px 0;font-size:32px;font-weight:bold;letter-spacing:8px;">${escapeHtml(otp)}</p>
    <p style="margin:0;">⏰ This code expires in ${expiresInMinutes} minutes</p>`;
  const footer = `
    If you didn't request this verification code, please ignore this email or contact our support team.<br>
    <strong>Security tip:</strong> Never share your OTP code with anyone. We will never ask for your code via phone or email.`;

  return { subject: 'Majestic Lounge OTP', html: renderEmailLayout(body, footer) };
}

/** Replaces Laravel's default "Reset Password" notification used by the website. */
export function renderPasswordResetLinkEmail(
  resetUrl: string,
  expiresInMinutes: number,
): EmailContent {
  const safeUrl = escapeHtml(resetUrl);
  const body = `
    <h2 style="margin:0 0 8px 0;">Reset Password</h2>
    <p>You are receiving this email because we received a password reset request for your account.</p>
    <p style="margin:24px 0;"><a href="${safeUrl}" style="background:#1a1a2e;color:#ffffff;padding:12px 24px;border-radius:4px;text-decoration:none;">Reset Password</a></p>
    <p>This password reset link will expire in ${expiresInMinutes} minutes.</p>
    <p style="font-size:12px;color:#777;">If the button doesn't work, copy this link into your browser:<br>${safeUrl}</p>`;
  const footer = 'If you did not request a password reset, no further action is required.';

  return { subject: 'Reset Password Notification', html: renderEmailLayout(body, footer) };
}

/**
 * Port of Laravel `emails/register.blade.php` (the `welcomeMail` mailable).
 * Laravel sends it to the staff notification list, not to the customer.
 */
export function renderWelcomeEmail(fullName: string): EmailContent {
  const body = `
    <h2 style="margin:0 0 16px 0;">Welcome, ${escapeHtml(fullName)}!</h2>
    <p>Congratulations on successfully registering with us. We're excited to have you on board!</p>
    <p>Thank you for choosing Majestic Lounge. We look forward to serving you with our premium services.</p>
    <p>📧 If you have any questions, feel free to contact us at <strong>contact@majestic.com.pk</strong></p>`;
  const footer = `
    Welcome to the Majestic Lounge family! We're here to provide you with exceptional service and unforgettable experiences.<br>
    This email was sent because you successfully registered an account with Majestic Lounge.`;

  return { subject: 'New user registered', html: renderEmailLayout(body, footer) };
}
