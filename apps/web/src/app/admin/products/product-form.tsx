'use client';

import { FormLayout, FullWidth } from '@/components/admin/form-layout';
import { SelectField } from '@/components/forms/select-field';
import { TextField } from '@/components/forms/text-field';
import { saveProductAction } from '@/lib/actions/admin/catalog-actions';
import { useActionForm } from '@/lib/forms/use-action-form';
import { productSchema, type ProductValues } from '@/lib/validation/admin';

interface ProductFormProps {
  id: number | null;
  initialValues: Partial<ProductValues>;
  services: { value: number; label: string }[];
  categories: { value: number; label: string }[];
}

const asNumber = { valueAsNumber: true } as const;

export function ProductForm({ id, initialValues, services, categories }: ProductFormProps) {
  const { form, submit, isSubmitting, formError } = useActionForm<ProductValues>({
    schema: productSchema,
    defaultValues: initialValues,
    action: (values) => saveProductAction(id, values),
  });

  return (
    <FormLayout
      onSubmit={submit}
      formError={formError}
      isSubmitting={isSubmitting}
      cancelHref="/admin/products"
    >
      <FullWidth>
        <TextField form={form} name="name" label="Name" required maxLength={255} />
      </FullWidth>
      <SelectField
        form={form}
        name="serviceId"
        label="Service"
        placeholder="Choose a service"
        options={services}
        required
        registerOptions={asNumber}
      />
      <SelectField
        form={form}
        name="categoryId"
        label="Category"
        placeholder="Choose a category"
        options={categories}
        required
        registerOptions={asNumber}
      />
      <FullWidth>
        <TextField form={form} name="description" label="Description" hint="Optional" multiline />
      </FullWidth>

      <FullWidth>
        <h2 className="border-t border-stone-100 pt-4 text-sm font-semibold">Prices (PKR)</h2>
        <p className="text-xs text-stone-500">
          Total = adults × adult price + children beyond the free allowance × child price + infants
          beyond the free allowance × infant price + guests × guest price.
        </p>
      </FullWidth>
      <TextField
        form={form}
        name="price"
        label="Adult price"
        type="number"
        min={0}
        step="0.01"
        required
        registerOptions={asNumber}
      />
      <TextField
        form={form}
        name="adultLimit"
        label="Adult limit"
        type="number"
        min={0}
        required
        hint="Kept from the previous system; not used in the price."
        registerOptions={asNumber}
      />
      <TextField
        form={form}
        name="childPrice"
        label="Child price"
        type="number"
        min={0}
        required
        registerOptions={asNumber}
      />
      <TextField
        form={form}
        name="childLimit"
        label="Free children"
        type="number"
        min={0}
        required
        registerOptions={asNumber}
      />
      <TextField
        form={form}
        name="infantPrice"
        label="Infant price"
        type="number"
        min={0}
        required
        registerOptions={asNumber}
      />
      <TextField
        form={form}
        name="infantLimit"
        label="Free infants"
        type="number"
        min={0}
        required
        registerOptions={asNumber}
      />
      <TextField
        form={form}
        name="guestPrice"
        label="Guest price"
        type="number"
        min={0}
        hint="Leave empty if guests are not offered."
        registerOptions={asNumber}
      />
    </FormLayout>
  );
}
