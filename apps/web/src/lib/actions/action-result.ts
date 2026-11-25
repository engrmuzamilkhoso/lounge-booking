import type { z } from 'zod';
import { ApiError } from '../api/api-error';

/**
 * What a Server Action returns when it does not redirect: a message for the form and
 * per-field messages keyed by form field name.
 */
export type ActionResult<TData = undefined> =
  | { ok: true; data: TData; message?: string }
  | { ok: false; message: string; fieldErrors: Record<string, string> };

export function actionFailure(
  message: string,
  fieldErrors: Record<string, string> = {},
): ActionResult<never> {
  return { ok: false, message, fieldErrors };
}

/** Converts Zod issues into one message per field (the first problem for each). */
export function validationFailure(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.');
    if (fieldErrors[field] === undefined) {
      fieldErrors[field] = issue.message;
    }
  }
  return actionFailure('Please check the highlighted fields.', fieldErrors);
}

/**
 * Turns an API error into an action failure. API field errors use the same names as the
 * forms, so they show next to the right input. Anything else is rethrown (Next.js handles
 * redirects and unexpected errors).
 */
export function apiFailure(error: unknown): ActionResult<never> {
  if (!(error instanceof ApiError)) {
    throw error;
  }
  const fieldErrors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    const firstMessage = messages[0];
    if (firstMessage !== undefined) {
      fieldErrors[field] = firstMessage;
    }
  }
  return actionFailure(error.message, fieldErrors);
}
