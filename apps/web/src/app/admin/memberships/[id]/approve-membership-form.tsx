'use client';

import { BadgeCheck } from 'lucide-react';
import { SelectField } from '@/components/forms/select-field';
import { TextField } from '@/components/forms/text-field';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { approveMembershipAction } from '@/lib/actions/admin/operations-actions';
import { useActionForm } from '@/lib/forms/use-action-form';
import { approveMembershipSchema, type ApproveMembershipValues } from '@/lib/validation/admin';

interface ApproveMembershipFormProps {
  membershipId: number;
  suggestedSerialNo: string;
  products: { value: number; label: string }[];
}

export function ApproveMembershipForm({
  membershipId,
  suggestedSerialNo,
  products,
}: ApproveMembershipFormProps) {
  const { form, submit, isSubmitting, formError } = useActionForm<ApproveMembershipValues>({
    schema: approveMembershipSchema,
    defaultValues: { serialNo: suggestedSerialNo, visitLimit: 1 },
    action: (values) => approveMembershipAction(membershipId, values),
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void submit(event);
      }}
      className="grid gap-5 sm:grid-cols-3"
    >
      {formError !== null && (
        <Alert tone="error" className="sm:col-span-3">
          {formError}
        </Alert>
      )}
      <TextField form={form} name="serialNo" label="Serial number" inputMode="numeric" required />
      <SelectField
        form={form}
        name="productId"
        label="Membership product"
        placeholder="Choose a product"
        options={products}
        required
        registerOptions={{ valueAsNumber: true }}
      />
      <TextField
        form={form}
        name="visitLimit"
        label="Number of visits"
        type="number"
        min={1}
        required
        registerOptions={{ valueAsNumber: true }}
      />
      <div className="sm:col-span-3">
        <Button
          type="submit"
          variant="gold"
          isLoading={isSubmitting}
          icon={<BadgeCheck aria-hidden className="size-4" />}
        >
          Approve membership
        </Button>
      </div>
    </form>
  );
}
