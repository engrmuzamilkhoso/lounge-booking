import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { getRecordOrNotFound, idParam } from '@/lib/admin/queries';
import type { Booking } from '@/lib/api/types';
import { BookingEditForm } from './booking-edit-form';

export const metadata: Metadata = { title: 'Edit booking' };

export default async function EditBookingPage({ params }: PageProps<'/admin/bookings/[id]/edit'>) {
  const { permissions } = await getAdminAccess('/admin/bookings');
  if (!permissions.has('booking_edit')) {
    return <AccessDenied />;
  }
  const { id } = await params;
  const booking = await getRecordOrNotFound<Booking>(`/admin/bookings/${idParam(id)}`);

  return (
    <>
      <PageHeader
        title={`Edit booking ${booking.code}`}
        back={{ href: `/admin/bookings/${booking.id}`, label: `Booking ${booking.code}` }}
      />
      <BookingEditForm
        bookingId={booking.id}
        initialValues={{
          flightNumber: booking.flightNumber,
          flightDetail: booking.flightDetail ?? '',
          departureDate: booking.departureDate,
          departureTime: booking.departureTime ?? '',
        }}
      />
    </>
  );
}
