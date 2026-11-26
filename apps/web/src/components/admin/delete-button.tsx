'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { deleteRecordAction } from '@/lib/actions/admin/delete-actions';
import type { AdminResource } from '@/lib/admin/resources';

interface DeleteButtonProps {
  resource: AdminResource;
  id: number;
  /** What is being deleted, e.g. "booking ML0000201". */
  label: string;
  /** Where to go afterwards; omit to stay on the page (e.g. a list) and refresh it. */
  redirectTo?: string;
  /** Icon-only button for table rows. */
  compact?: boolean;
}

/** Asks for confirmation, deletes, then refreshes the page or moves to `redirectTo`. */
export function DeleteButton({
  resource,
  id,
  label,
  redirectTo,
  compact = false,
}: DeleteButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteRecordAction(resource, id);
      setIsOpen(false);
      if (!result.ok) {
        toast.error('Could not delete', result.message);
        return;
      }
      toast.success('Deleted', `The ${label} was deleted.`);
      if (redirectTo === undefined) {
        router.refresh();
      } else {
        router.push(redirectTo);
      }
    });
  }

  return (
    <>
      {compact ? (
        <button
          type="button"
          aria-label={`Delete ${label}`}
          title="Delete"
          className="rounded-lg p-2 text-stone-500 hover:bg-red-50 hover:text-red-700"
          onClick={() => {
            setIsOpen(true);
          }}
        >
          <Trash2 aria-hidden className="size-4" />
        </button>
      ) : (
        <Button
          variant="danger"
          icon={<Trash2 aria-hidden className="size-4" />}
          onClick={() => {
            setIsOpen(true);
          }}
        >
          Delete
        </Button>
      )}
      <ConfirmDialog
        isOpen={isOpen}
        onCancel={() => {
          setIsOpen(false);
        }}
        onConfirm={confirmDelete}
        title={`Delete ${label}?`}
        description="It will be removed from the system. This cannot be undone from the panel."
        confirmLabel="Delete"
        isConfirming={isPending}
      />
    </>
  );
}
