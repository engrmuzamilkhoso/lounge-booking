'use client';

import { FormLayout } from '@/components/admin/form-layout';
import { TextField } from '@/components/forms/text-field';
import { savePermissionAction } from '@/lib/actions/admin/lookup-actions';
import { useActionForm } from '@/lib/forms/use-action-form';
import { permissionSchema, type PermissionValues } from '@/lib/validation/admin';

export function PermissionForm({ id, initialTitle }: { id: number | null; initialTitle: string }) {
  const { form, submit, isSubmitting, formError } = useActionForm<PermissionValues>({
    schema: permissionSchema,
    defaultValues: { title: initialTitle },
    action: (values) => savePermissionAction(id, values),
  });

  return (
    <FormLayout
      onSubmit={submit}
      formError={formError}
      isSubmitting={isSubmitting}
      cancelHref="/admin/permissions"
    >
      <TextField
        form={form}
        name="title"
        label="Permission key"
        required
        maxLength={255}
        hint="Lowercase with underscores, e.g. booking_access"
      />
    </FormLayout>
  );
}
