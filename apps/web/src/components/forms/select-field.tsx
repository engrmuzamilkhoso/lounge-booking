'use client';

import type { ComponentProps } from 'react';
import type { FieldValues, Path, RegisterOptions, UseFormReturn } from 'react-hook-form';
import { describedBy, FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/input';

interface SelectFieldProps<TValues extends FieldValues> extends Omit<
  ComponentProps<'select'>,
  'name' | 'form' | 'id'
> {
  form: UseFormReturn<TValues>;
  name: Path<TValues>;
  label: string;
  hint?: string;
  options: { value: string | number; label: string }[];
  placeholder: string;
  registerOptions?: RegisterOptions<TValues, Path<TValues>>;
}

/** A labelled <select> wired to React Hook Form, with its validation message. */
export function SelectField<TValues extends FieldValues>({
  form,
  name,
  label,
  hint,
  required,
  options,
  placeholder,
  registerOptions,
  ...selectProps
}: SelectFieldProps<TValues>) {
  const id = `field-${name}`;
  const error = form.getFieldState(name, form.formState).error?.message;

  return (
    <FormField id={id} label={label} required={required} hint={hint} error={error}>
      <Select
        id={id}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy(id, hint, error)}
        aria-required={required}
        defaultValue=""
        {...selectProps}
        {...form.register(name, registerOptions)}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormField>
  );
}
