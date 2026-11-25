import { PassStatus } from '@booking/shared-types';
import { Download, QrCode } from 'lucide-react';
import Image from 'next/image';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import type { Booking, BookingPass } from '@/lib/api/types';
import { passQrCodeDataUrl } from '@/lib/content/pass-qr-code';
import { formatDate, formatDateTime, formatTime } from '@/lib/format';

const statusBadge: Record<PassStatus, { label: string; tone: BadgeTone }> = {
  [PassStatus.Valid]: { label: 'Ready to use', tone: 'success' },
  [PassStatus.AlreadyUsed]: { label: 'Used', tone: 'neutral' },
  [PassStatus.PaymentRequired]: { label: 'Payment required', tone: 'warning' },
  [PassStatus.Expired]: { label: 'Expired', tone: 'neutral' },
  [PassStatus.Cancelled]: { label: 'Cancelled', tone: 'danger' },
};

interface LoungePassProps {
  booking: Booking;
  pass: BookingPass;
}

/**
 * The customer's lounge pass: a QR code to show at the Majestic counter. Staff scan it to
 * verify the booking; the customer can download it to keep it offline.
 */
export async function LoungePass({ booking, pass }: LoungePassProps) {
  const qrCodeDataUrl = await passQrCodeDataUrl(pass.token);
  const badge = statusBadge[pass.status];
  const passengerCount = booking.adults + booking.children + booking.infants + booking.guests;

  return (
    <section
      aria-labelledby="lounge-pass-title"
      className="overflow-hidden rounded-card border border-gold-200 bg-white shadow-card"
    >
      <div className="flex items-center justify-between gap-3 bg-espresso-900 px-6 py-4 text-white">
        <h2
          id="lounge-pass-title"
          className="flex items-center gap-2 text-base font-semibold text-white"
        >
          <QrCode aria-hidden className="size-5 text-gold-300" />
          Your lounge pass
        </h2>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      <div className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-start">
        <Image
          src={qrCodeDataUrl}
          alt={`QR code for booking ${booking.code}`}
          width={220}
          height={220}
          unoptimized
          className={
            pass.status === PassStatus.Valid
              ? 'size-56 shrink-0 rounded-lg border border-stone-200'
              : 'size-56 shrink-0 rounded-lg border border-stone-200 opacity-40 grayscale'
          }
        />

        <div className="flex w-full flex-col gap-4 text-sm">
          <dl className="grid grid-cols-2 gap-3">
            <PassDetail label="Booking" value={booking.code} />
            <PassDetail label="Passengers" value={String(passengerCount)} />
            <PassDetail label="Flight" value={booking.flightNumber} />
            <PassDetail
              label="Departure"
              value={`${formatDate(booking.departureDate)}, ${formatTime(booking.departureTime)}`}
            />
          </dl>

          <p className="text-stone-600">{passMessage(pass)}</p>

          {pass.status === PassStatus.Valid && (
            <a
              href={qrCodeDataUrl}
              download={`majestic-pass-${booking.code}.png`}
              className={buttonClasses('gold', 'md', 'w-full sm:w-auto')}
            >
              <Download aria-hidden className="size-4" />
              Save QR code
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function passMessage(pass: BookingPass): string {
  if (pass.status === PassStatus.AlreadyUsed && pass.checkedInAt !== null) {
    return `This pass was used at the counter on ${formatDateTime(pass.checkedInAt)}.`;
  }
  if (pass.status === PassStatus.Expired) {
    return 'This pass has expired because the departure date has passed.';
  }
  if (pass.status === PassStatus.Cancelled) {
    return 'This booking was cancelled, so the pass can no longer be used.';
  }
  return 'Show this QR code at the Majestic counter on your travel day. Save it to your phone or take a screenshot. It can be used once, and a copy has been emailed to you.';
}

function PassDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-stone-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-espresso-900">{value}</dd>
    </div>
  );
}
