'use client';

import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

interface CheckboxFieldProps<TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  name: Path<TValues>;
  label: string;
  hint?: string;
}

/** A single yes/no checkbox wired to React Hook Form. */
export function CheckboxField<TValues extends FieldValues>({
  form,
  name,
  label,
  hint,
}: CheckboxFieldProps<TValues>) {
  const id = `field-${name}`;
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-4 rounded border-stone-300 accent-gold-500"
        {...form.register(name)}
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium text-espresso-900">
          {label}
        </label>
        {hint !== undefined && <p className="text-xs text-stone-500">{hint}</p>}
      </div>
    </div>
  );
}

interface CheckboxGroupFieldProps<TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  /** A string[] field: the ticked options' values. */
  name: Path<TValues>;
  legend: string;
  options: { value: string; label: string }[];
  /** Number of columns on wide screens. */
  columns?: 1 | 2 | 3;
}

const columnClasses = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3' } as const;

/** Several checkboxes sharing one array field, e.g. a role's permissions. */
export function CheckboxGroupField<TValues extends FieldValues>({
  form,
  name,
  legend,
  options,
  columns = 2,
}: CheckboxGroupFieldProps<TValues>) {
  const error = form.getFieldState(name, form.formState).error?.message;
  return (
    <fieldset aria-describedby={error === undefined ? undefined : `field-${name}-error`}>
      <legend className="text-sm font-medium text-espresso-900">{legend}</legend>
      <div className={`mt-2 grid gap-2 ${columnClasses[columns]}`}>
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm hover:bg-stone-50"
          >
            <input
              type="checkbox"
              value={option.value}
              className="size-4 rounded border-stone-300 accent-gold-500"
              {...form.register(name)}
            />
            <span className="break-all">{option.label}</span>
          </label>
        ))}
      </div>
      {error !== undefined && (
        <p
          id={`field-${name}-error`}
          role="alert"
          className="mt-1 text-xs font-medium text-red-700"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}
