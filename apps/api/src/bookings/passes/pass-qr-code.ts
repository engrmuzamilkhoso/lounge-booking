import { passVerificationPath } from '@booking/shared-types';
import QRCode from 'qrcode';

/** Pixel size of the QR image attached to emails. */
const EMAIL_QR_SIZE = 440;

/** What the QR code holds: the staff verification page for this pass. */
export function passVerificationUrl(webUrl: string, passToken: string): string {
  return new URL(passVerificationPath(passToken), webUrl).toString();
}

/** PNG image of the pass QR code (medium error correction survives screen glare and scuffs). */
export function renderPassQrPng(webUrl: string, passToken: string): Promise<Buffer> {
  return QRCode.toBuffer(passVerificationUrl(webUrl, passToken), {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 2,
    width: EMAIL_QR_SIZE,
  });
}
