'use client';

import { Lock } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { startPaymentAction } from '@/lib/actions/payment-actions';
import { formatRupees } from '@/lib/format';

interface PayNowButtonProps {
  bookingId: number;
  amount: number;
  label?: string;
}

/**
 * Opens Safepay's secure checkout. Disabled while the session is being prepared so repeated
 * clicks cannot start several payments (the API also reuses one session per booking).
 */
export function PayNowButton({ bookingId, amount, label }: PayNowButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      {error !== null && <Alert tone="error">{error}</Alert>}
      <Button
        size="lg"
        className="w-full"
        isLoading={isPending}
        icon={<Lock aria-hidden className="size-4" />}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await startPaymentAction(bookingId);
            // On success the action redirects to Safepay; only failures return here.
            if (!result.ok) {
              setError(result.message);
            }
          });
        }}
      >
        {isPending ? 'Opening secure checkout…' : (label ?? `Pay ${formatRupees(amount)}`)}
      </Button>
    </div>
  );
}
