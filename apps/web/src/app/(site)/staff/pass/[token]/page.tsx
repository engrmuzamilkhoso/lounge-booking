import { ShieldAlert } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { isStaff } from '@/lib/admin/access';
import { requireUser } from '@/lib/auth/current-user';
import { adminPassPath } from '@/lib/passes/scan-input';

export const metadata: Metadata = {
  title: 'Lounge pass',
  robots: { index: false, follow: false },
};

/**
 * The address inside every pass QR code (it must stay stable: passes are already in customers'
 * phones and emails). Staff are sent to the verification page in the admin panel; a customer
 * who scans their own code is told to show it at the counter.
 */
export default async function PassLinkPage({ params }: PageProps<'/staff/pass/[token]'>) {
  const { token } = await params;
  const user = await requireUser(`/staff/pass/${token}`);
  if (isStaff(user)) {
    redirect(adminPassPath(token));
  }

  return (
    <Container className="max-w-2xl py-8 sm:py-12">
      <div className="flex flex-col items-center gap-3 rounded-card border border-stone-200 bg-white p-8 text-center shadow-card">
        <ShieldAlert aria-hidden className="size-10 text-gold-600" />
        <h1 className="text-xl font-semibold">This is your lounge pass</h1>
        <p className="max-w-md text-sm text-stone-600">
          Show the QR code at the Majestic counter and our staff will scan it for you.
        </p>
        <ButtonLink href="/my-bookings" variant="secondary" className="mt-2">
          My bookings
        </ButtonLink>
      </div>
    </Container>
  );
}
