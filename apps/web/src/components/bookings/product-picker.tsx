'use client';

import { calculateBookingTotal } from '@booking/shared-types';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { ButtonLink } from '@/components/ui/button';
import type { Product } from '@/lib/api/types';
import { MAX_PASSENGERS_PER_TYPE, passengerBands, pricesOf } from '@/lib/content/product-prices';
import { formatRupees } from '@/lib/format';
import { QuantityStepper } from './quantity-stepper';

interface ProductPickerProps {
  product: Product;
  /** Verified membership the booking will use (Membership service only). */
  membershipId?: number;
}

/** One product with passenger counters and the live total; continues to the booking form. */
export function ProductPicker({ product, membershipId }: ProductPickerProps) {
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [guests, setGuests] = useState(0);
  const hasGuestOption = product.guestPrice !== null;

  const total = calculateBookingTotal(pricesOf(product), { adults, children, infants, guests });

  const query = new URLSearchParams({
    product: String(product.id),
    adults: String(adults),
    children: String(children),
    infants: String(infants),
    guests: String(guests),
  });
  if (membershipId !== undefined) {
    query.set('membership', String(membershipId));
  }

  return (
    <article className="flex flex-col rounded-card border border-stone-200 bg-white shadow-card">
      <div className="border-b border-stone-100 p-6">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        {product.description !== null && (
          <p className="mt-2 text-sm leading-relaxed text-stone-600">{product.description}</p>
        )}
        <p className="mt-4 text-sm text-stone-600">
          {product.price !== null && product.price > 0 ? (
            <>
              <span className="text-xl font-semibold text-espresso-900">
                {formatRupees(product.price)}
              </span>{' '}
              per adult
            </>
          ) : (
            <span className="font-semibold text-emerald-700">Included — no charge</span>
          )}
        </p>
      </div>

      <div className="divide-y divide-stone-100 px-6">
        <QuantityStepper
          label={passengerBands.adults}
          hint={passengerBands.adultsHint}
          value={adults}
          min={1}
          max={MAX_PASSENGERS_PER_TYPE}
          onChange={setAdults}
        />
        <QuantityStepper
          label={passengerBands.children}
          hint={childHint(product)}
          value={children}
          min={0}
          max={MAX_PASSENGERS_PER_TYPE}
          onChange={setChildren}
        />
        <QuantityStepper
          label={passengerBands.infants}
          hint={infantHint(product)}
          value={infants}
          min={0}
          max={MAX_PASSENGERS_PER_TYPE}
          onChange={setInfants}
        />
        {hasGuestOption && (
          <QuantityStepper
            label={passengerBands.guests}
            hint={`${formatRupees(product.guestPrice ?? 0)} each`}
            value={guests}
            min={0}
            max={MAX_PASSENGERS_PER_TYPE}
            onChange={setGuests}
          />
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-stone-100 p-6">
        <div>
          <p className="text-xs font-medium tracking-wide text-stone-500 uppercase">Total</p>
          <p className="text-xl font-semibold text-espresso-900">{formatRupees(total)}</p>
        </div>
        <ButtonLink
          href={`/book?${query.toString()}`}
          icon={<ArrowRight aria-hidden className="order-last size-4" />}
        >
          Continue
        </ButtonLink>
      </div>
    </article>
  );
}

function childHint(product: Product): string {
  if (product.childLimit > 0) {
    return `${passengerBands.childrenHint} · ${product.childLimit} free, then ${formatRupees(product.childPrice)}`;
  }
  return passengerBands.childrenHint;
}

function infantHint(product: Product): string {
  if (product.infantLimit > 0) {
    return `${passengerBands.infantsHint} · ${product.infantLimit} free, then ${formatRupees(product.infantPrice)}`;
  }
  return passengerBands.infantsHint;
}
