'use client';

import { TextField } from '@/components/forms/text-field';
import { saveNameLookupAction } from '@/lib/actions/admin/lookup-actions';
import type { NameLookupKey } from '@/lib/admin/name-lookups';
import { useActionForm } from '@/lib/forms/use-action-form';
import { nameSchema, type NameValues } from '@/lib/validation/admin';
import { FormLayout } from '../form-layout';

interface NameLookupFormProps {
  lookup: NameLookupKey;
  id: number | null;
  initialName: string;
  maxLength: number;
  cancelHref: string;
}

export function NameLookupForm({
  lookup,
  id,
  initialName,
  maxLength,
  cancelHref,
}: NameLookupFormProps) {
  const { form, submit, isSubmitting, formError } = useActionForm<NameValues>({
    schema: nameSchema(maxLength),
    defaultValues: { name: initialName },
    action: (values) => saveNameLookupAction(lookup, id, values),
  });

  return (
    <FormLayout
      onSubmit={submit}
      formError={formError}
      isSubmitting={isSubmitting}
      cancelHref={cancelHref}
    >
      <TextField form={form} name="name" label="Name" required maxLength={maxLength} autoFocus />
    </FormLayout>
  );
}
