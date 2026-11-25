import { clsx, type ClassValue } from 'clsx';

/**
 * Joins class names, skipping falsy values. Components put their base classes first and the
 * caller's `className` last, so callers can add classes (they should not need to override).
 */
export function cn(...classes: ClassValue[]): string {
  return clsx(classes);
}
