import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { CameraScanner } from '@/components/passes/camera-scanner';
import { PassScanField } from '@/components/passes/pass-scan-field';
import { getAdminAccess } from '@/lib/admin/access';

export const metadata: Metadata = { title: 'Scan passes' };

/**
 * Counter check-in. Three ways to open a pass:
 * 1. A USB or Bluetooth QR scanner (types into the box and presses Enter).
 * 2. The booking reference, typed into the same box.
 * 3. The device camera (phones, tablets, laptops with a webcam).
 */
export default async function CheckInPage() {
  const { permissions } = await getAdminAccess('/admin/check-in');
  if (!permissions.has('booking_show')) {
    return <AccessDenied />;
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Scan passes"
        description="Scan the customer's QR code with the scanner or the camera, or type the booking reference."
      />

      <section className="rounded-card border border-stone-200 bg-white p-6 shadow-card">
        <PassScanField />
        <p className="mt-3 text-xs text-stone-500">
          With a USB scanner, just scan: the pass opens on its own. The box picks up the scan even
          if you clicked somewhere else on the page.
        </p>
      </section>

      <section className="mt-6 rounded-card border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-base font-semibold">No scanner? Use the camera</h2>
        <div className="mx-auto max-w-sm">
          <CameraScanner />
        </div>
      </section>
    </div>
  );
}
