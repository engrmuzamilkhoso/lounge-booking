'use client';

import { FormLayout, FullWidth } from '@/components/admin/form-layout';
import { CheckboxField } from '@/components/forms/checkbox-field';
import { TextField } from '@/components/forms/text-field';
import { saveCardAction } from '@/lib/actions/admin/catalog-actions';
import { useActionForm } from '@/lib/forms/use-action-form';
import { cardSchema, type CardValues } from '@/lib/validation/admin';

export function CardForm({ id, initialValues }: { id: number | null; initialValues: CardValues }) {
  const { form, submit, isSubmitting, formError } = useActionForm<CardValues>({
    schema: cardSchema,
    defaultValues: initialValues,
    action: (values) => saveCardAction(id, values),
  });

  return (
    <FormLayout
      onSubmit={submit}
      formError={formError}
      isSubmitting={isSubmitting}
      cancelHref="/admin/cards"
    >
      <TextField form={form} name="name" label="Card name" required maxLength={200} />
      <TextField
        form={form}
        name="detail"
        label="Detail"
        required
        maxLength={50}
        hint="e.g. Visa Signature"
      />
      <FullWidth>
        <TextField
          form={form}
          name="bin"
          label="BIN numbers"
          required
          maxLength={100}
          hint="First digits of the card numbers, as given by the bank."
        />
      </FullWidth>
      <TextField
        form={form}
        name="sortOrder"
        label="Display order"
        type="number"
        min={0}
        hint="Lower numbers are listed first. Optional."
        registerOptions={{ valueAsNumber: true }}
      />
      <FullWidth>
        <CheckboxField
          form={form}
          name="isActive"
          label="Active"
          hint="Inactive cards are hidden from customers."
        />
      </FullWidth>
    </FormLayout>
  );
}
