import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { requireUser } from '@/lib/auth/current-user';
import { FindByCodeForm } from './find-by-code-form';
import { PassScanner } from './pass-scanner';

export const metadata: Metadata = {
  title: 'Scan lounge passes',
  robots: { index: false, follow: false },
};

/**
 * Counter staff: scan a customer's pass QR code, or type the booking reference. Access to the
 * pass details is enforced by the API (booking_show / booking_edit permissions).
 */
export default async function CheckInPage() {
  await requireUser('/staff/check-in');

  return (
    <Container className="max-w-md py-8 sm:py-12">
      <h1 className="text-2xl font-semibold">Scan lounge pass</h1>
      <p className="mt-1 text-sm text-stone-600">
        Scan the QR code on the customer&apos;s phone or printout to check whether they may enter.
      </p>

      <div className="mt-6">
        <PassScanner />
      </div>

      <div className="mt-8 border-t border-stone-200 pt-6">
        <h2 className="text-base font-semibold">QR code not scanning?</h2>
        <p className="mt-1 mb-4 text-sm text-stone-600">
          Enter the booking reference from the customer&apos;s confirmation.
        </p>
        <FindByCodeForm />
      </div>
    </Container>
  );
}
