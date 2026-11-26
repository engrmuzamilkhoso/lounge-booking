'use client';

import { FormLayout, FullWidth } from '@/components/admin/form-layout';
import { TextField } from '@/components/forms/text-field';
import { saveMembershipTypeAction } from '@/lib/actions/admin/catalog-actions';
import { useActionForm } from '@/lib/forms/use-action-form';
import { membershipTypeSchema, type MembershipTypeValues } from '@/lib/validation/admin';

const asNumber = { valueAsNumber: true } as const;

export function MembershipTypeForm({
  id,
  initialValues,
}: {
  id: number | null;
  initialValues: Partial<MembershipTypeValues>;
}) {
  const { form, submit, isSubmitting, formError } = useActionForm<MembershipTypeValues>({
    schema: membershipTypeSchema,
    defaultValues: initialValues,
    action: (values) => saveMembershipTypeAction(id, values),
  });

  return (
    <FormLayout
      onSubmit={submit}
      formError={formError}
      isSubmitting={isSubmitting}
      cancelHref="/admin/membership-types"
    >
      <FullWidth>
        <TextField form={form} name="name" label="Name" required maxLength={255} />
      </FullWidth>
      <TextField
        form={form}
        name="price1"
        label="First price (PKR)"
        type="number"
        min={0}
        step="0.01"
        required
        registerOptions={asNumber}
      />
      <TextField
        form={form}
        name="price1Text"
        label="First price label"
        required
        maxLength={100}
        hint="e.g. Annual fee"
      />
      <TextField
        form={form}
        name="price2"
        label="Second price (PKR)"
        type="number"
        min={0}
        step="0.01"
        required
        registerOptions={asNumber}
      />
      <TextField
        form={form}
        name="price2Text"
        label="Second price label"
        required
        maxLength={100}
        hint="e.g. Per visit"
      />
    </FormLayout>
  );
}
