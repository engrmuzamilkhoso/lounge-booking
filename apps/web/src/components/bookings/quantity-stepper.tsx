'use client';

import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

/** − value + control with a visible label; the value is announced when it changes. */
export function QuantityStepper({ label, hint, value, min, max, onChange }: QuantityStepperProps) {
  const buttonClasses =
    'flex size-9 items-center justify-center rounded-full border border-stone-300 text-espresso-900 transition-colors hover:border-gold-500 hover:bg-gold-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-espresso-900">{label}</p>
        {hint !== undefined && <p className="text-xs text-stone-500">{hint}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={buttonClasses}
          onClick={() => {
            onChange(value - 1);
          }}
          disabled={value <= min}
          aria-label={`Fewer ${label.toLowerCase()}`}
        >
          <Minus aria-hidden className="size-4" />
        </button>
        <span
          aria-live="polite"
          className="w-6 text-center text-base font-semibold tabular-nums text-espresso-900"
        >
          {value}
        </span>
        <button
          type="button"
          className={buttonClasses}
          onClick={() => {
            onChange(value + 1);
          }}
          disabled={value >= max}
          aria-label={`More ${label.toLowerCase()}`}
        >
          <Plus aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}
