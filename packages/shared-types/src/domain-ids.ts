/**
 * Database ids that the business logic depends on.
 *
 * The Laravel application hard-coded these numbers in controllers. They are seeded/imported
 * with the same ids, so they are kept here as named constants instead of magic numbers.
 */

export const ServiceId = {
  MeetAndAssist: 1,
  Lounge: 2,
  Membership: 3,
  PremierServices: 4,
} as const;
export type ServiceId = (typeof ServiceId)[keyof typeof ServiceId];

export const ProductCategoryId = {
  Domestic: 1,
  International: 2,
  InternationalDomestic: 3,
} as const;
export type ProductCategoryId = (typeof ProductCategoryId)[keyof typeof ProductCategoryId];

export const RoleId = {
  Admin: 1,
  Customer: 2,
  Agent: 4,
} as const;
export type RoleId = (typeof RoleId)[keyof typeof RoleId];

/** Where a booking came from (`source_requests` table). */
export const SourceRequestId = {
  Web: 1,
  App: 2,
} as const;
export type SourceRequestId = (typeof SourceRequestId)[keyof typeof SourceRequestId];

/** `booking_details.attendee_type` */
export const AttendeeType = {
  Adult: 1,
  Child: 2,
  Infant: 3,
} as const;
export type AttendeeType = (typeof AttendeeType)[keyof typeof AttendeeType];

/** `memberships.status` */
export const MembershipStatus = {
  Pending: 1,
  Approved: 2,
} as const;
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];
