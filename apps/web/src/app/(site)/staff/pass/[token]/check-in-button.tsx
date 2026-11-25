'use client';

import { DoorOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { checkInPassAction } from '@/lib/actions/pass-actions';

/**
 * Records that the customer was let in. Afterwards the page reloads and shows the pass as used,
 * so scanning it again (or a screenshot of it) is refused.
 */
export function CheckInButton({ passToken }: { passToken: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      {error !== null && <Alert tone="error">{error}</Alert>}
      <Button
        size="lg"
        className="w-full"
        isLoading={isPending}
        icon={<DoorOpen aria-hidden className="size-5" />}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await checkInPassAction(passToken);
            if (!result.ok) {
              setError(result.message);
            }
            // Refresh in both cases: a failure usually means someone else just checked it in.
            router.refresh();
          });
        }}
      >
        {isPending ? 'Checking in…' : 'Check in and let the customer in'}
      </Button>
    </div>
  );
}
