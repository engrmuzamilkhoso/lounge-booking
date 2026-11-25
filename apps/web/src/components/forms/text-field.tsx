'use client';

import type { ComponentProps } from 'react';
import { type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';
import { describedBy, FormField } from '@/components/ui/form-field';
import { Input, Textarea } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';

interface TextFieldProps<TValues extends FieldValues> extends Omit<
  ComponentProps<'input'>,
  'name' | 'form' | 'id'
> {
  form: UseFormReturn<TValues>;
  name: Path<TValues>;
  label: string;
  hint?: string;
  /** Renders a multi-line text area instead of a single-line input. */
  multiline?: boolean;
}

/** A labelled input wired to React Hook Form, with its validation message. */
export function TextField<TValues extends FieldValues>({
  form,
  name,
  label,
  hint,
  required,
  type,
  multiline = false,
  ...inputProps
}: TextFieldProps<TValues>) {
  const id = `field-${name}`;
  const error = form.formState.errors[name]?.message;
  const errorMessage = typeof error === 'string' ? error : undefined;
  const sharedProps = {
    id,
    'aria-invalid': errorMessage !== undefined,
    'aria-describedby': describedBy(id, hint, errorMessage),
    'aria-required': required,
    ...form.register(name),
  };

  let control;
  if (multiline) {
    control = <Textarea {...sharedProps} placeholder={inputProps.placeholder} />;
  } else if (type === 'password') {
    control = <PasswordInput {...inputProps} {...sharedProps} />;
  } else {
    control = <Input type={type} {...inputProps} {...sharedProps} />;
  }

  return (
    <FormField id={id} label={label} required={required} hint={hint} error={errorMessage}>
      {control}
    </FormField>
  );
}
