'use client';

import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';

type ToastTone = 'success' | 'error';

interface ToastMessage {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastApi {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const AUTO_DISMISS_MS = 5000;

/** Short-lived notifications for the result of an action ("Booking saved", "Could not…"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (tone: ToastTone, title: string, description?: string) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, tone, title, description }]);
      setTimeout(() => {
        dismiss(id);
      }, AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, description) => {
        show('success', title, description);
      },
      error: (title, description) => {
        show('error', title, description);
      },
    }),
    [show],
  );

  return (
    <ToastContext value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  const isError = toast.tone === 'error';
  const Icon = isError ? CircleAlert : CircleCheck;

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-raised"
    >
      <Icon
        aria-hidden
        className={cn('mt-0.5 size-5 shrink-0', isError ? 'text-red-700' : 'text-emerald-700')}
      />
      <div className="flex-1 text-sm">
        <p className="font-medium text-espresso-900">{toast.title}</p>
        {toast.description !== undefined && (
          <p className="mt-0.5 text-stone-600">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          onDismiss(toast.id);
        }}
        className="rounded-md p-1 text-stone-400 hover:text-stone-700"
        aria-label="Dismiss notification"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (api === null) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return api;
}
