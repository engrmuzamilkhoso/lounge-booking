'use client';

import { FormLayout, FullWidth } from '@/components/admin/form-layout';
import { TextField } from '@/components/forms/text-field';
import { updateBookingAction } from '@/lib/actions/admin/operations-actions';
import { useActionForm } from '@/lib/forms/use-action-form';
import { updateBookingSchema, type UpdateBookingValues } from '@/lib/validation/admin';

interface BookingEditFormProps {
  bookingId: number;
  initialValues: UpdateBookingValues;
}

/** Flight details only: passenger counts and price are fixed once a booking is made. */
export function BookingEditForm({ bookingId, initialValues }: BookingEditFormProps) {
  const { form, submit, isSubmitting, formError } = useActionForm<UpdateBookingValues>({
    schema: updateBookingSchema,
    defaultValues: initialValues,
    action: (values) => updateBookingAction(bookingId, values),
  });

  return (
    <FormLayout
      onSubmit={submit}
      formError={formError}
      isSubmitting={isSubmitting}
      cancelHref={`/admin/bookings/${bookingId}`}
    >
      <TextField form={form} name="flightNumber" label="Flight number" required />
      <TextField form={form} name="flightDetail" label="Flight details" hint="Optional" />
      <TextField form={form} name="departureDate" label="Departure date" type="date" required />
      <TextField form={form} name="departureTime" label="Departure time" type="time" required />
      <FullWidth>
        <p className="text-xs text-stone-500">
          To change passengers or the product, delete this booking and create a new one.
        </p>
      </FullWidth>
    </FormLayout>
  );
}
