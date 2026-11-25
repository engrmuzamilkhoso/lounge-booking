'use client';

import { BadgeCheck, Crown } from 'lucide-react';
import { useState, useTransition } from 'react';
import { ProductPicker } from '@/components/bookings/product-picker';
import { Alert } from '@/components/ui/alert';
import { Button, ButtonLink } from '@/components/ui/button';
import { describedBy, FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { verifyMembershipAction } from '@/lib/actions/booking-actions';
import type { MembershipVerification, Product } from '@/lib/api/types';

/**
 * Membership services are only shown after the membership number is verified (Laravel's
 * "Membership verification" box). The booking itself re-checks the visit limit on the server.
 */
export function MembershipGate({ products }: { products: Product[] }) {
  const [serialNo, setSerialNo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState<MembershipVerification | null>(null);
  const [isPending, startTransition] = useTransition();

  if (verified !== null) {
    return (
      <div className="flex flex-col gap-8">
        <Alert tone="success" title={`Membership ${verified.serialNo} verified`}>
          {verified.remainingVisits} {verified.remainingVisits === 1 ? 'visit' : 'visits'}{' '}
          remaining.
        </Alert>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductPicker
              key={product.id}
              product={product}
              membershipId={verified.membershipId}
            />
          ))}
        </div>
      </div>
    );
  }

  const fieldId = 'membership-number';
  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <form
        className="rounded-card border border-stone-200 bg-white p-6 shadow-card sm:p-8"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await verifyMembershipAction(serialNo);
            if (result.ok) {
              setVerified(result.data);
            } else {
              setError(result.message);
            }
          });
        }}
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-gold-50 text-gold-600">
          <BadgeCheck aria-hidden className="size-6" />
        </span>
        <h2 className="mt-4 text-xl font-semibold">Verify your membership</h2>
        <p className="mt-1 text-sm text-stone-600">
          Enter the membership number printed on your Majestic card.
        </p>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          <FormField
            id={fieldId}
            label="Membership number"
            error={error ?? undefined}
            className="flex-1"
          >
            <Input
              id={fieldId}
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 00000007"
              value={serialNo}
              onChange={(event) => {
                setSerialNo(event.target.value);
              }}
              aria-invalid={error !== null}
              aria-describedby={describedBy(fieldId, undefined, error ?? undefined)}
            />
          </FormField>
          <Button type="submit" isLoading={isPending}>
            Verify
          </Button>
        </div>
      </form>

      <div className="rounded-card bg-espresso-900 p-6 text-stone-200 sm:p-8">
        <Crown aria-hidden className="size-8 text-gold-300" />
        <h2 className="mt-4 text-xl font-semibold text-white">Not a member yet?</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Pick the plan best suited to your needs to acquire the Majestic Lounge exclusive
          membership card.
        </p>
        <ButtonLink href="/membership" variant="gold" className="mt-6">
          View membership plans
        </ButtonLink>
      </div>
    </div>
  );
}
