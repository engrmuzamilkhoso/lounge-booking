'use client';

import { FormLayout, FullWidth } from '@/components/admin/form-layout';
import { SelectField } from '@/components/forms/select-field';
import { TextField } from '@/components/forms/text-field';
import { saveMembershipAction } from '@/lib/actions/admin/operations-actions';
import { useActionForm } from '@/lib/forms/use-action-form';
import { membershipSchema, type MembershipValues } from '@/lib/validation/admin';

interface MembershipFormProps {
  id: number | null;
  initialValues: Partial<MembershipValues>;
  membershipTypes: { value: number; label: string }[];
}

export function MembershipForm({ id, initialValues, membershipTypes }: MembershipFormProps) {
  const { form, submit, isSubmitting, formError } = useActionForm<MembershipValues>({
    schema: membershipSchema,
    defaultValues: initialValues,
    action: (values) => saveMembershipAction(id, values),
  });

  return (
    <FormLayout
      onSubmit={submit}
      formError={formError}
      isSubmitting={isSubmitting}
      cancelHref={id === null ? '/admin/memberships' : `/admin/memberships/${id}`}
    >
      <TextField form={form} name="name" label="Full name" required />
      <SelectField
        form={form}
        name="membershipTypeId"
        label="Membership type"
        placeholder="Choose a type"
        options={membershipTypes}
        required
        registerOptions={{ valueAsNumber: true }}
      />
      <TextField form={form} name="email" label="Email" type="email" required />
      <TextField form={form} name="contactNo" label="Phone" type="tel" required />
      <TextField form={form} name="dob" label="Date of birth" type="date" required />
      <TextField form={form} name="country" label="Country" required />
      <FullWidth>
        <TextField form={form} name="address" label="Address" multiline required />
      </FullWidth>
      <TextField form={form} name="city" label="City" required />
      <TextField form={form} name="state" label="State / province" required />
      <TextField form={form} name="zipcode" label="Postcode" required />
    </FormLayout>
  );
}
