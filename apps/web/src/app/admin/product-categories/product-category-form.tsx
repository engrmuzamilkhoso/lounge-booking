'use client';

import { FormLayout, FullWidth } from '@/components/admin/form-layout';
import { TextField } from '@/components/forms/text-field';
import { saveProductCategoryAction } from '@/lib/actions/admin/catalog-actions';
import { useActionForm } from '@/lib/forms/use-action-form';
import { productCategorySchema, type ProductCategoryValues } from '@/lib/validation/admin';

export function ProductCategoryForm({
  id,
  initialValues,
}: {
  id: number | null;
  initialValues: ProductCategoryValues;
}) {
  const { form, submit, isSubmitting, formError } = useActionForm<ProductCategoryValues>({
    schema: productCategorySchema,
    defaultValues: initialValues,
    action: (values) => saveProductCategoryAction(id, values),
  });

  return (
    <FormLayout
      onSubmit={submit}
      formError={formError}
      isSubmitting={isSubmitting}
      cancelHref="/admin/product-categories"
    >
      <TextField form={form} name="name" label="Name" required maxLength={255} />
      <FullWidth>
        <TextField form={form} name="description" label="Description" hint="Optional" multiline />
      </FullWidth>
    </FormLayout>
  );
}
