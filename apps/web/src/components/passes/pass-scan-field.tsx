'use client';

import { ScanLine } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { describedBy } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { findPassByCodeAction } from '@/lib/actions/pass-actions';
import { adminPassPath, readScanInput } from '@/lib/passes/scan-input';

/**
 * One box for everything at the counter: a USB/Bluetooth QR scanner types the pass into it and
 * presses Enter, or staff type a booking reference.
 *
 * Whenever no other text box has focus, the first key pressed moves focus here, so a scan is
 * never lost (for example right after clicking "Check in"), and a scanner's Enter can never
 * press a button by accident.
 */
export function PassScanField() {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function captureTyping(event: KeyboardEvent) {
      const input = inputRef.current;
      if (input === null || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (isTextEntry(document.activeElement)) {
        return;
      }
      if (event.key.length === 1) {
        // Focusing during keydown sends this key into the box.
        input.focus();
        return;
      }
      if (event.key === 'Enter') {
        // A scanner's Enter must not activate a focused button (e.g. "Check in").
        event.preventDefault();
        input.focus();
      }
    }
    window.addEventListener('keydown', captureTyping);
    return () => {
      window.removeEventListener('keydown', captureTyping);
    };
  }, []);

  function showError(message: string) {
    setError(message);
    // Selected text is replaced by the next scan, so staff do not have to clear the box.
    inputRef.current?.select();
  }

  function submit() {
    setError(undefined);
    const scan = readScanInput(value);
    if (scan.kind === 'unrecognised') {
      showError('Not a Majestic pass or booking reference. Scan again or type the reference.');
      return;
    }
    if (scan.kind === 'pass') {
      setValue('');
      router.push(adminPassPath(scan.token));
      return;
    }
    startTransition(async () => {
      // On success the action opens the pass page; only failures come back.
      const result = await findPassByCodeAction(scan.code);
      if (!result.ok) {
        showError(result.fieldErrors.code ?? result.message);
      }
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-2"
    >
      <label htmlFor={inputId} className="text-sm font-medium text-espresso-900">
        Scan the QR code or type the booking reference
      </label>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          id={inputId}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
          }}
          placeholder="Waiting for scan… or type ML0000201"
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={error !== undefined}
          aria-describedby={describedBy(inputId, undefined, error)}
          className="flex-1 text-base"
        />
        <Button
          type="submit"
          isLoading={isPending}
          icon={<ScanLine aria-hidden className="size-4" />}
        >
          Verify
        </Button>
      </div>
      {error !== undefined && (
        <p id={`${inputId}-error`} role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}

function isTextEntry(element: Element | null): boolean {
  if (element === null) {
    return false;
  }
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    return true;
  }
  if (element instanceof HTMLInputElement) {
    return !['button', 'submit', 'checkbox', 'radio', 'reset'].includes(element.type);
  }
  return element instanceof HTMLElement && element.isContentEditable;
}
