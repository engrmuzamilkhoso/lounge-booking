'use client';

import { FormLayout, FullWidth } from '@/components/admin/form-layout';
import { SelectField } from '@/components/forms/select-field';
import { TextField } from '@/components/forms/text-field';
import { saveFaqQuestionAction } from '@/lib/actions/admin/catalog-actions';
import { useActionForm } from '@/lib/forms/use-action-form';
import { faqQuestionSchema, type FaqQuestionValues } from '@/lib/validation/admin';

interface FaqQuestionFormProps {
  id: number | null;
  initialValues: Partial<FaqQuestionValues>;
  categories: { value: number; label: string }[];
}

export function FaqQuestionForm({ id, initialValues, categories }: FaqQuestionFormProps) {
  const { form, submit, isSubmitting, formError } = useActionForm<FaqQuestionValues>({
    schema: faqQuestionSchema,
    defaultValues: initialValues,
    action: (values) => saveFaqQuestionAction(id, values),
  });

  return (
    <FormLayout
      onSubmit={submit}
      formError={formError}
      isSubmitting={isSubmitting}
      cancelHref="/admin/faq-questions"
    >
      <SelectField
        form={form}
        name="categoryId"
        label="Category"
        placeholder="Choose a category"
        options={categories}
        required
        registerOptions={{ valueAsNumber: true }}
      />
      <FullWidth>
        <TextField form={form} name="question" label="Question" required />
      </FullWidth>
      <FullWidth>
        <TextField form={form} name="answer" label="Answer" multiline required />
      </FullWidth>
    </FormLayout>
  );
}
