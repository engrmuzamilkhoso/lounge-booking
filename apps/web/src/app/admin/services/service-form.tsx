'use client';

import { FormLayout } from '@/components/admin/form-layout';
import { TextField } from '@/components/forms/text-field';
import { saveServiceAction } from '@/lib/actions/admin/catalog-actions';
import { useActionForm } from '@/lib/forms/use-action-form';
import { serviceSchema, type ServiceValues } from '@/lib/validation/admin';

export function ServiceForm({
  id,
  initialValues,
}: {
  id: number | null;
  initialValues: ServiceValues;
}) {
  const { form, submit, isSubmitting, formError } = useActionForm<ServiceValues>({
    schema: serviceSchema,
    defaultValues: initialValues,
    action: (values) => saveServiceAction(id, values),
  });

  return (
    <FormLayout
      onSubmit={submit}
      formError={formError}
      isSubmitting={isSubmitting}
      cancelHref="/admin/services"
    >
      <TextField form={form} name="name" label="Name" required maxLength={100} />
      <TextField
        form={form}
        name="appDescription"
        label="Description in the app"
        hint="Optional"
        maxLength={100}
      />
      <TextField form={form} name="appRoute" label="App route" hint="Optional" maxLength={45} />
      <TextField form={form} name="appIcon" label="App icon" hint="Optional" maxLength={45} />
      <TextField
        form={form}
        name="iconForApp"
        label="Icon name for the app"
        hint="Optional"
        maxLength={20}
      />
    </FormLayout>
  );
}
