import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Spinner } from './spinner';

export type ButtonVariant = 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap ' +
  'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ' +
  'aria-disabled:pointer-events-none aria-disabled:opacity-60';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-espresso-900 text-white hover:bg-espresso-700 active:bg-espresso-950 shadow-sm',
  gold: 'bg-gold-500 text-white hover:bg-gold-600 active:bg-gold-700 shadow-sm',
  secondary:
    'bg-white text-espresso-900 border border-stone-300 hover:bg-stone-50 hover:border-stone-400',
  ghost: 'text-espresso-900 hover:bg-stone-100',
  danger: 'bg-red-700 text-white hover:bg-red-800 active:bg-red-900 shadow-sm',
  inverse: 'bg-white text-espresso-900 hover:bg-gold-50 shadow-sm',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(baseClasses, variantClasses[variant], sizeClasses[size], className);
}

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, disables the button and announces the busy state. */
  isLoading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant,
  size,
  isLoading = false,
  icon,
  className,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled === true || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

/** A link that looks like a button (navigation, not an action). */
export function ButtonLink({
  variant,
  size,
  icon,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}
