'use client';

import { AttendeeType, priceBreakdown } from '@booking/shared-types';
import { CreditCard, Plane, UsersRound } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { OrderSummary } from '@/components/bookings/order-summary';
import { SelectField } from '@/components/forms/select-field';
import { TextField } from '@/components/forms/text-field';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { createBookingAction } from '@/lib/actions/booking-actions';
import type { BankCard, Product } from '@/lib/api/types';
import { pricesOf } from '@/lib/content/product-prices';
import { useActionForm } from '@/lib/forms/use-action-form';
import {
  bookingFormSchema,
  type BookingFormValues,
  type PassengerValues,
} from '@/lib/validation/booking';

interface BookingFormProps {
  product: Product;
  serviceName: string;
  counts: { adults: number; children: number; infants: number; guests: number };
  membershipId?: number;
  bankCards: BankCard[];
  nationalities: string[];
}

const DEFAULT_NATIONALITY = 'Pakistani';

export function BookingForm({
  product,
  serviceName,
  counts,
  membershipId,
  bankCards,
  nationalities,
}: BookingFormProps) {
  // One key per form: a double submit or a retry returns the same booking.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const lines = priceBreakdown(pricesOf(product), counts);
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const needsBankCard = bankCards.length > 0;
  const defaultNationality = nationalities.includes(DEFAULT_NATIONALITY) ? DEFAULT_NATIONALITY : '';

  const { form, submit, isSubmitting, formError } = useActionForm<BookingFormValues>({
    schema: bookingFormSchema,
    defaultValues: {
      productId: product.id,
      flightNumber: '',
      departureDate: '',
      departureTime: '',
      ...counts,
      bankCardId: undefined,
      membershipId,
      expectedTotalAmount: total,
      attendees: buildPassengers(counts, defaultNationality),
    },
    action: (values) => createBookingAction(values, idempotencyKey),
  });

  const passengers = form.getValues('attendees');
  const nationalityOptions = nationalities.map((name) => ({ value: name, label: name }));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start"
    >
      <div className="flex flex-col gap-6">
        {formError !== null && <Alert tone="error">{formError}</Alert>}

        <FormSection icon={Plane} title="Flight details">
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField
              form={form}
              name="flightNumber"
              label="Flight number"
              placeholder="e.g. EK 603"
              required
            />
            <TextField
              form={form}
              name="departureDate"
              label="Departure date"
              type="date"
              min={today}
              required
            />
            <TextField
              form={form}
              name="departureTime"
              label="Departure time"
              type="time"
              required
            />
          </div>
        </FormSection>

        {needsBankCard && (
          <FormSection icon={CreditCard} title="Bank card for lounge access">
            <SelectField
              form={form}
              name="bankCardId"
              label="Your Alliance Partner bank card"
              hint="Bring this card with you; it is checked at the lounge."
              placeholder="Select your card"
              options={bankCards.map((card) => ({ value: card.id, label: card.name }))}
              registerOptions={{
                setValueAs: (value: string) => (value === '' ? undefined : Number(value)),
              }}
              required
            />
          </FormSection>
        )}

        <FormSection icon={UsersRound} title="Passengers">
          <div className="flex flex-col gap-8">
            {passengers.map((passenger, index) => (
              <fieldset key={index} className="rounded-xl border border-stone-200 p-5">
                <legend className="px-2 text-sm font-semibold text-espresso-900">
                  {passengerTitle(passenger, passengers, index)}
                </legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    form={form}
                    name={`attendees.${index}.name`}
                    label="Full name"
                    autoComplete="name"
                    required
                  />
                  <TextField
                    form={form}
                    name={`attendees.${index}.dob`}
                    label="Date of birth"
                    type="date"
                    max={today}
                    required
                  />
                  {passenger.type === AttendeeType.Adult && (
                    <>
                      <TextField
                        form={form}
                        name={`attendees.${index}.passportCnic`}
                        label="CNIC / passport number"
                        required
                      />
                      <TextField
                        form={form}
                        name={`attendees.${index}.passportCnicExpiry`}
                        label="CNIC / passport expiry"
                        type="date"
                        required
                      />
                      <TextField
                        form={form}
                        name={`attendees.${index}.contactNo`}
                        label="Phone"
                        type="tel"
                        autoComplete="tel"
                        required
                      />
                      <TextField
                        form={form}
                        name={`attendees.${index}.email`}
                        label="Email"
                        type="email"
                        autoComplete="email"
                        required
                      />
                    </>
                  )}
                  {passenger.type !== AttendeeType.Adult && (
                    <TextField
                      form={form}
                      name={`attendees.${index}.guardianContact`}
                      label="Guardian's phone"
                      type="tel"
                      required
                    />
                  )}
                  <SelectField
                    form={form}
                    name={`attendees.${index}.nationality`}
                    label="Nationality"
                    placeholder="Select nationality"
                    options={nationalityOptions}
                    required
                  />
                  <div className="sm:col-span-2">
                    <TextField
                      form={form}
                      name={`attendees.${index}.address`}
                      label="Address"
                      autoComplete="street-address"
                      required
                    />
                  </div>
                </div>
              </fieldset>
            ))}
          </div>
        </FormSection>
      </div>

      <div className="lg:sticky lg:top-24">
        <OrderSummary
          serviceName={serviceName}
          productName={product.name ?? serviceName}
          lines={lines}
          total={total}
          footer={
            <>
              <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
                {total > 0 ? 'Continue to payment' : 'Confirm booking'}
              </Button>
              <p className="mt-3 text-center text-xs text-stone-500">
                {total > 0
                  ? 'You will review the booking before paying securely with Safepay.'
                  : 'No payment is needed for this booking.'}
              </p>
            </>
          }
        />
      </div>
    </form>
  );
}

function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Plane;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-stone-200 bg-white p-6 shadow-card">
      <h2 className="mb-5 flex items-center gap-2 text-base font-semibold">
        <Icon aria-hidden className="size-5 text-gold-600" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function buildPassengers(
  counts: BookingFormProps['counts'],
  nationality: string,
): PassengerValues[] {
  const blank = (type: PassengerValues['type']): PassengerValues => ({
    type,
    name: '',
    dob: '',
    nationality,
    address: '',
    passportCnic: '',
    passportCnicExpiry: '',
    contactNo: '',
    email: '',
    guardianContact: '',
  });
  return [
    ...Array.from({ length: counts.adults }, () => blank(AttendeeType.Adult)),
    ...Array.from({ length: counts.children }, () => blank(AttendeeType.Child)),
    ...Array.from({ length: counts.infants }, () => blank(AttendeeType.Infant)),
  ];
}

const SINGULAR_LABEL: Record<PassengerValues['type'], string> = {
  [AttendeeType.Adult]: 'Adult',
  [AttendeeType.Child]: 'Child',
  [AttendeeType.Infant]: 'Infant',
};

/** "Adult 1", "Child 2", … numbered within each type. */
function passengerTitle(passenger: PassengerValues, all: PassengerValues[], index: number): string {
  const position = all.slice(0, index + 1).filter((other) => other.type === passenger.type).length;
  return `${SINGULAR_LABEL[passenger.type]} ${position}`;
}
