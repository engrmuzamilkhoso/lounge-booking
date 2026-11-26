'use client';

import { FormLayout, FullWidth } from '@/components/admin/form-layout';
import { CheckboxGroupField } from '@/components/forms/checkbox-field';
import { TextField } from '@/components/forms/text-field';
import { saveRoleAction } from '@/lib/actions/admin/access-actions';
import { useActionForm } from '@/lib/forms/use-action-form';
import { roleSchema, type RoleValues } from '@/lib/validation/admin';

interface RoleFormProps {
  id: number | null;
  initialValues: RoleValues;
  permissions: { value: string; label: string }[];
}

export function RoleForm({ id, initialValues, permissions }: RoleFormProps) {
  const { form, submit, isSubmitting, formError } = useActionForm<RoleValues>({
    schema: roleSchema,
    defaultValues: initialValues,
    action: (values) => saveRoleAction(id, values),
  });

  return (
    <FormLayout
      onSubmit={submit}
      formError={formError}
      isSubmitting={isSubmitting}
      cancelHref="/admin/roles"
    >
      <TextField form={form} name="title" label="Role name" required maxLength={255} />
      <FullWidth>
        <CheckboxGroupField
          form={form}
          name="permissionIds"
          legend="Permissions"
          options={permissions}
          columns={3}
        />
      </FullWidth>
    </FormLayout>
  );
}
