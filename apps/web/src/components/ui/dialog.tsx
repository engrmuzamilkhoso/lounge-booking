'use client';

import { X } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';
import { Button, type ButtonVariant } from './button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

/**
 * Modal built on the native <dialog> element, which provides focus trapping, Escape to close
 * and an inert background without extra libraries.
 */
export function Dialog({ isOpen, onClose, title, description, children, footer }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }
    if (isOpen && !dialog.open) {
      dialog.showModal();
    }
    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="dialog-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-stone-200 bg-white p-0 shadow-raised backdrop:bg-espresso-950/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-5">
        <div>
          <h2 id="dialog-title" className="text-lg font-semibold">
            {title}
          </h2>
          {description !== undefined && (
            <p className="mt-1 text-sm text-stone-600">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-stone-400 hover:text-stone-700"
          aria-label="Close"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>
      {children !== undefined && <div className="px-6 pt-4">{children}</div>}
      {footer !== undefined && (
        <div className="mt-6 flex justify-end gap-3 px-6 pb-5">{footer}</div>
      )}
      {footer === undefined && <div className="pb-5" />}
    </dialog>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  isConfirming?: boolean;
}

/** Asks before destructive actions (delete, cancel). */
export function ConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel,
  confirmVariant = 'danger',
  isConfirming = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={isConfirming}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} isLoading={isConfirming}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
