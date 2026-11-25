'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import {
  type DefaultValues,
  type FieldValues,
  type Path,
  useForm,
  type UseFormReturn,
} from 'react-hook-form';
import type { z } from 'zod';
import type { ActionResult } from '../actions/action-result';

interface UseActionFormOptions<TValues extends FieldValues, TData> {
  schema: z.ZodType<TValues, TValues>;
  defaultValues: DefaultValues<TValues>;
  /** Server Action to call with the validated values. A redirect inside it navigates away. */
  action: (values: TValues) => Promise<ActionResult<TData>>;
  onSuccess?: (data: TData) => void;
}

interface UseActionFormResult<TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  /** Pass to <form onSubmit>. */
  submit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  /** Message for the whole form (e.g. "The email or password is incorrect."). */
  formError: string | null;
}

/**
 * React Hook Form + Zod in the browser, then a Server Action that validates again and calls
 * the API. Field errors returned by the server are shown next to the matching inputs.
 */
export function useActionForm<TValues extends FieldValues, TData = undefined>({
  schema,
  defaultValues,
  action,
  onSuccess,
}: UseActionFormOptions<TValues, TData>): UseActionFormResult<TValues> {
  const form = useForm<TValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onTouched',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await action(values);
      if (result.ok) {
        onSuccess?.(result.data);
        return;
      }
      setFormError(result.message);
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        form.setError(field as Path<TValues>, { type: 'server', message });
      }
    });
  });

  return { form, submit, isSubmitting: isPending, formError };
}
