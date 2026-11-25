import { z } from 'zod';

/**
 * Form rules matching the API's validation (apps/api/src/auth/dto/auth.dto.ts), so users see
 * problems before submitting. The API remains the authority and validates again.
 */

const email = z.email('Enter a valid email address').max(255);

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter your first name').max(255),
  lastName: z.string().trim().min(1, 'Enter your last name').max(50),
  email,
  cnic: z
    .string()
    .trim()
    .min(1, 'Enter your CNIC or passport number')
    .max(20, 'At most 20 characters'),
  contact: z.string().trim().min(1, 'Enter your phone number').max(20, 'At most 20 characters'),
  password: z.string().min(6, 'Use at least 6 characters').max(72),
});
export type SignUpValues = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Use at least 6 characters').max(72),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'The passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
