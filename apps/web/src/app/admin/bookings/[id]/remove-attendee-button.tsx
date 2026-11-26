'use client';

import { UserMinus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ConfirmDialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { removeAttendeeAction } from '@/lib/actions/admin/operations-actions';

interface RemoveAttendeeButtonProps {
  bookingId: number;
  attendeeId: number;
  name: string;
}

export function RemoveAttendeeButton({ bookingId, attendeeId, name }: RemoveAttendeeButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        aria-label={`Remove passenger ${name}`}
        title="Remove passenger"
        className="rounded-lg p-2 text-stone-500 hover:bg-red-50 hover:text-red-700"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <UserMinus aria-hidden className="size-4" />
      </button>
      <ConfirmDialog
        isOpen={isOpen}
        onCancel={() => {
          setIsOpen(false);
        }}
        onConfirm={() => {
          startTransition(async () => {
            const result = await removeAttendeeAction(bookingId, attendeeId);
            setIsOpen(false);
            if (!result.ok) {
              toast.error('Could not remove passenger', result.message);
              return;
            }
            toast.success('Passenger removed', name);
            router.refresh();
          });
        }}
        title={`Remove ${name}?`}
        description="The passenger is removed from this booking. The booking total does not change."
        confirmLabel="Remove"
        isConfirming={isPending}
      />
    </>
  );
}
