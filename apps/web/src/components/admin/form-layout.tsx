import { ButtonLink } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';

interface FormLayoutProps {
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  formError: string | null;
  isSubmitting: boolean;
  cancelHref: string;
  submitLabel?: string;
  children: ReactNode;
}

/** White card holding an admin form, with the error banner and Save / Cancel buttons. */
export function FormLayout({
  onSubmit,
  formError,
  isSubmitting,
  cancelHref,
  submitLabel = 'Save',
  children,
}: FormLayoutProps) {
  return (
    <form
      noValidate
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      className="max-w-3xl rounded-card border border-stone-200 bg-white p-6 shadow-card"
    >
      {formError !== null && (
        <Alert tone="error" className="mb-5">
          {formError}
        </Alert>
      )}
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
      <div className="mt-6 flex flex-wrap gap-3 border-t border-stone-100 pt-5">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
        <ButtonLink href={cancelHref} variant="secondary">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}

/** A form section spanning both columns. */
export function FullWidth({ children }: { children: ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>;
}
