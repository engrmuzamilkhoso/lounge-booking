'use client';

import { Eye, EyeOff } from 'lucide-react';
import { type ComponentProps, useState } from 'react';
import { Input } from './input';

/** Password field with a show/hide toggle. */
export function PasswordInput(props: Omit<ComponentProps<'input'>, 'type'>) {
  const [isVisible, setIsVisible] = useState(false);
  const ToggleIcon = isVisible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input type={isVisible ? 'text' : 'password'} className="pr-11" {...props} />
      <button
        type="button"
        onClick={() => {
          setIsVisible((current) => !current);
        }}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-stone-500 hover:text-espresso-900"
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        aria-pressed={isVisible}
      >
        <ToggleIcon aria-hidden className="size-4" />
      </button>
    </div>
  );
}
