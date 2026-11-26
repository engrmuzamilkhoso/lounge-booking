import { z } from 'zod';

/**
 * Admin form rules, mirroring the API DTOs (apps/api/src/**\/*.dto.ts). The API validates
 * again; these give instant feedback in the form.
 *
 * Numeric inputs are registered with `valueAsNumber`, so an empty input arrives as NaN.
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function requiredText(label: string, maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, `Enter the ${label}`)
    .max(maxLength, `Use at most ${maxLength} characters`);
}

function optionalText(maxLength: number) {
  return z.string().trim().max(maxLength, `Use at most ${maxLength} characters`);
}

function wholeNumber(label: string, minimum = 0) {
  return z
    .number({ error: `Enter the ${label}` })
    .int(`The ${label} must be a whole number`)
    .min(minimum, `The ${label} must be at least ${minimum}`);
}

function amount(label: string) {
  return z
    .number({ error: `Enter the ${label}` })
    .min(0, `The ${label} cannot be negative`)
    .multipleOf(0.01, 'Use at most two decimal places');
}

function selectedId(label: string) {
  return z
    .number({ error: `Choose a ${label}` })
    .int()
    .positive(`Choose a ${label}`);
}

/** Checkbox groups give string values; at least one must be ticked. */
function selectedIds(message: string) {
  return z.array(z.string()).min(1, message);
}

// ───────────────────────────── Simple lookups ─────────────────────────────

/** Nationalities, statuses, booking sources, FAQ categories: just a name. */
export function nameSchema(maxLength: number) {
  return z.object({ name: requiredText('name', maxLength) });
}
export type NameValues = { name: string };

export const permissionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Enter the permission key')
    .max(255)
    .regex(/^[a-z0-9_]+$/, 'Use lowercase letters, digits and underscores, e.g. booking_access'),
});
export type PermissionValues = z.infer<typeof permissionSchema>;

// ──────────────────────────────── Catalogue ───────────────────────────────

export const productCategorySchema = z.object({
  name: requiredText('name', 255),
  description: optionalText(5000),
});
export type ProductCategoryValues = z.infer<typeof productCategorySchema>;

export const serviceSchema = z.object({
  name: requiredText('name', 100),
  appDescription: optionalText(100),
  appRoute: optionalText(45),
  appIcon: optionalText(45),
  iconForApp: optionalText(20),
});
export type ServiceValues = z.infer<typeof serviceSchema>;

export const productSchema = z.object({
  name: requiredText('name', 255),
  description: optionalText(5000),
  serviceId: selectedId('service'),
  categoryId: selectedId('category'),
  price: amount('adult price'),
  adultLimit: wholeNumber('adult limit'),
  childPrice: wholeNumber('child price'),
  childLimit: wholeNumber('free children'),
  infantPrice: wholeNumber('infant price'),
  infantLimit: wholeNumber('free infants'),
  /** NaN (empty) = no guest price. */
  guestPrice: z.number().int('The guest price must be a whole number').min(0).or(z.nan()),
});
export type ProductValues = z.infer<typeof productSchema>;

export const cardSchema = z.object({
  name: requiredText('card name', 200),
  detail: requiredText('detail', 50),
  bin: requiredText('BIN numbers', 100),
  sortOrder: z.number().int().min(0, 'Use 0 or more').or(z.nan()),
  isActive: z.boolean(),
});
export type CardValues = z.infer<typeof cardSchema>;

export const membershipTypeSchema = z.object({
  name: requiredText('name', 255),
  price1: amount('first price'),
  price1Text: requiredText('first price label', 100),
  price2: amount('second price'),
  price2Text: requiredText('second price label', 100),
});
export type MembershipTypeValues = z.infer<typeof membershipTypeSchema>;

// ────────────────────────────────── FAQ ──────────────────────────────────

export const faqQuestionSchema = z.object({
  categoryId: selectedId('category'),
  question: requiredText('question', 5000),
  answer: requiredText('answer', 20000),
});
export type FaqQuestionValues = z.infer<typeof faqQuestionSchema>;

// ─────────────────────────────── Access ──────────────────────────────────

export const roleSchema = z.object({
  title: requiredText('role name', 255),
  permissionIds: selectedIds('Choose at least one permission'),
});
export type RoleValues = z.infer<typeof roleSchema>;

const userFields = {
  firstName: requiredText('first name', 255),
  lastName: optionalText(50),
  email: z.email('Enter a valid email address').max(255),
  cnic: optionalText(20),
  contact: optionalText(20),
  roleIds: selectedIds('Choose at least one role'),
};

export const createUserSchema = z.object({
  ...userFields,
  password: z.string().min(8, 'Use at least 8 characters').max(72),
});
export type CreateUserValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  ...userFields,
  /** Empty = keep the current password. */
  password: z.union([z.literal(''), z.string().min(8, 'Use at least 8 characters').max(72)]),
});
export type UpdateUserValues = z.infer<typeof updateUserSchema>;

// ────────────────────────────── Memberships ──────────────────────────────

export const membershipSchema = z.object({
  name: requiredText('name', 255),
  membershipTypeId: selectedId('membership type'),
  dob: z.string().regex(DATE_ONLY, 'Choose the date of birth'),
  contactNo: requiredText('phone number', 255),
  email: z.email('Enter a valid email address').max(255),
  address: requiredText('address', 5000),
  city: requiredText('city', 100),
  state: requiredText('state', 100),
  zipcode: requiredText('postcode', 100),
  country: requiredText('country', 100),
});
export type MembershipValues = z.infer<typeof membershipSchema>;

export const approveMembershipSchema = z.object({
  serialNo: z
    .string()
    .trim()
    .regex(/^\d{1,200}$/, 'Use digits only'),
  productId: selectedId('membership product'),
  visitLimit: wholeNumber('number of visits', 1),
});
export type ApproveMembershipValues = z.infer<typeof approveMembershipSchema>;

// ──────────────────────────────── Bookings ───────────────────────────────

export const updateBookingSchema = z.object({
  flightNumber: requiredText('flight number', 255),
  flightDetail: optionalText(255),
  departureDate: z.string().regex(DATE_ONLY, 'Choose the departure date'),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Choose the departure time'),
});
export type UpdateBookingValues = z.infer<typeof updateBookingSchema>;
