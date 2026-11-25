import { CalendarPlus, ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { needsPayment, PaymentStatusBadge } from '@/components/bookings/payment-status-badge';
import { PageHero } from '@/components/layout/page-hero';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { getMyBookings } from '@/lib/api/queries';
import { requireUser } from '@/lib/auth/current-user';
import { formatDate, formatRupees, formatTime } from '@/lib/format';

export const metadata: Metadata = {
  title: 'My bookings',
  robots: { index: false },
};

export default async function MyBookingsPage({ searchParams }: PageProps<'/my-bookings'>) {
  await requireUser('/my-bookings');
  const { page } = await searchParams;
  const pageNumber = Math.max(1, Number(typeof page === 'string' ? page : '1') || 1);
  const { items: bookings, meta } = await getMyBookings(pageNumber);
  const pageCount = Math.max(1, Math.ceil(meta.total / meta.pageSize));

  return (
    <>
      <PageHero title="My bookings" description="Your Majestic bookings, newest first." />
      <Container className="py-10 sm:py-14">
        {bookings.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            title="No bookings yet"
            description="When you book a Majestic service it will appear here."
            action={<ButtonLink href="/services">Book a service</ButtonLink>}
          />
        ) : (
          <ul className="flex flex-col gap-4">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <Link
                  href={`/my-bookings/${booking.id}`}
                  className="group flex flex-col gap-4 rounded-card border border-stone-200 bg-white p-5 shadow-card transition hover:border-gold-300 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-espresso-900">{booking.code}</span>
                      <PaymentStatusBadge status={booking.paymentStatus} />
                    </div>
                    <p className="text-sm text-stone-600">
                      {booking.product?.name ?? booking.service.name} · {booking.service.name}
                    </p>
                    <p className="text-sm text-stone-500">
                      {booking.flightNumber} · {formatDate(booking.departureDate)} at{' '}
                      {formatTime(booking.departureTime)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-right">
                      <p className="font-semibold text-espresso-900">
                        {formatRupees(booking.totalAmount ?? 0)}
                      </p>
                      {needsPayment(booking.paymentStatus) && (
                        <p className="text-xs font-semibold text-gold-600">Pay now →</p>
                      )}
                    </div>
                    <ChevronRight
                      aria-hidden
                      className="size-5 text-stone-400 transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {pageCount > 1 && (
          <nav aria-label="Pagination" className="mt-8 flex items-center justify-between text-sm">
            <span className="text-stone-500">
              Page {meta.page} of {pageCount}
            </span>
            <div className="flex gap-2">
              {meta.page > 1 && (
                <ButtonLink
                  href={`/my-bookings?page=${meta.page - 1}`}
                  variant="secondary"
                  size="sm"
                >
                  Previous
                </ButtonLink>
              )}
              {meta.page < pageCount && (
                <ButtonLink
                  href={`/my-bookings?page=${meta.page + 1}`}
                  variant="secondary"
                  size="sm"
                >
                  Next
                </ButtonLink>
              )}
            </div>
          </nav>
        )}
      </Container>
    </>
  );
}
