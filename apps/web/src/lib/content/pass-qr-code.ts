import 'server-only';
import { passVerificationPath } from '@booking/shared-types';
import QRCode from 'qrcode';
import { siteConfig } from '../site-config';

/** Pixel size of the generated image: sharp when printed and easy to scan from a phone screen. */
const QR_IMAGE_SIZE = 600;

/**
 * The pass QR code as a PNG data URL. It holds the staff verification page for this pass, so
 * counter staff can scan it with the in-site scanner or any phone camera. Medium error
 * correction keeps it readable through screen glare and cracked screens.
 */
export function passQrCodeDataUrl(passToken: string): Promise<string> {
  const verificationUrl = new URL(passVerificationPath(passToken), siteConfig.url).toString();
  return QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: QR_IMAGE_SIZE,
    color: { dark: '#2D1107', light: '#FFFFFF' },
  });
}
