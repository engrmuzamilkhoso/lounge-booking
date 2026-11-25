'use client';

import { Search } from 'lucide-react';
import { useId, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { describedBy, FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { findPassByCodeAction } from '@/lib/actions/pass-actions';

/** Fallback when a QR code cannot be scanned: look the pass up by booking reference. */
export function FindByCodeForm() {
  const inputId = useId();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
      onSubmit={(event) => {
        event.preventDefault();
        setError(undefined);
        startTransition(async () => {
          // On success the action opens the verification page; only failures return here.
          const result = await findPassByCodeAction(code);
          if (!result.ok) {
            setError(result.fieldErrors.code ?? result.message);
          }
        });
      }}
    >
      <FormField id={inputId} label="Booking reference" error={error} className="flex-1">
        <Input
          id={inputId}
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
          }}
          placeholder="ML0000201"
          aria-describedby={describedBy(inputId, undefined, error)}
          aria-invalid={error !== undefined}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
        />
      </FormField>
      <Button
        type="submit"
        variant="secondary"
        isLoading={isPending}
        icon={<Search aria-hidden className="size-4" />}
        className="sm:mt-7"
      >
        Find
      </Button>
    </form>
  );
}
