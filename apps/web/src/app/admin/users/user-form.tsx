'use client';

import { FormLayout, FullWidth } from '@/components/admin/form-layout';
import { CheckboxGroupField } from '@/components/forms/checkbox-field';
import { TextField } from '@/components/forms/text-field';
import { createUserAction, updateUserAction } from '@/lib/actions/admin/access-actions';
import { useActionForm } from '@/lib/forms/use-action-form';
import {
  createUserSchema,
  type CreateUserValues,
  updateUserSchema,
  type UpdateUserValues,
} from '@/lib/validation/admin';

type RoleOption = { value: string; label: string };

export function CreateUserForm({ roles }: { roles: RoleOption[] }) {
  const { form, submit, isSubmitting, formError } = useActionForm<CreateUserValues>({
    schema: createUserSchema,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      cnic: '',
      contact: '',
      roleIds: [],
    },
    action: createUserAction,
  });

  return (
    <FormLayout
      onSubmit={submit}
      formError={formError}
      isSubmitting={isSubmitting}
      cancelHref="/admin/users"
    >
      <TextField form={form} name="firstName" label="First name" required />
      <TextField form={form} name="lastName" label="Last name" />
      <TextField form={form} name="email" label="Email" type="email" required />
      <TextField
        form={form}
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters. Share it with the user securely."
      />
      <TextField form={form} name="contact" label="Phone" type="tel" />
      <TextField form={form} name="cnic" label="CNIC" />
      <FullWidth>
        <CheckboxGroupField form={form} name="roleIds" legend="Roles" options={roles} columns={3} />
      </FullWidth>
    </FormLayout>
  );
}

export function EditUserForm({
  userId,
  initialValues,
  roles,
}: {
  userId: number;
  initialValues: UpdateUserValues;
  roles: RoleOption[];
}) {
  const { form, submit, isSubmitting, formError } = useActionForm<UpdateUserValues>({
    schema: updateUserSchema,
    defaultValues: initialValues,
    action: (values) => updateUserAction(userId, values),
  });

  return (
    <FormLayout
      onSubmit={submit}
      formError={formError}
      isSubmitting={isSubmitting}
      cancelHref="/admin/users"
    >
      <TextField form={form} name="firstName" label="First name" required />
      <TextField form={form} name="lastName" label="Last name" />
      <TextField form={form} name="email" label="Email" type="email" required />
      <TextField
        form={form}
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="Leave empty to keep the current password."
      />
      <TextField form={form} name="contact" label="Phone" type="tel" />
      <TextField form={form} name="cnic" label="CNIC" />
      <FullWidth>
        <CheckboxGroupField form={form} name="roleIds" legend="Roles" options={roles} columns={3} />
      </FullWidth>
    </FormLayout>
  );
}
