import { AttendeeType, ServiceId } from '@booking/shared-types';
import type { AttendeeDto } from './dto/attendee.dto.js';
import type { BookingDetailsDto } from './dto/booking.dto.js';

export interface BookedProduct {
  serviceId: number;
  /** null when the product has no guest option. */
  guestPrice: number | null;
}

/**
 * Business rules of a booking request that need the product but no other database lookups.
 * Returns field errors (empty when the request is valid).
 *
 * Rules from the Laravel booking flow:
 * - one passenger entry per adult, child and infant;
 * - the Lounge service needs a bank card;
 * - Membership-service products are booked with a verified membership, other services never are;
 * - guests only for products that have a guest price.
 */
export function findBookingRuleViolations(
  request: BookingDetailsDto,
  product: BookedProduct,
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  const attendeeCountError = checkAttendeeCounts(request);
  if (attendeeCountError !== null) {
    errors.attendees = [attendeeCountError];
  }

  const isLounge = product.serviceId === ServiceId.Lounge;
  if (isLounge && request.bankCardId === undefined) {
    errors.bankCardId = ['A bank card is required for the Lounge service'];
  }

  const isMembershipService = product.serviceId === ServiceId.Membership;
  if (isMembershipService && request.membershipId === undefined) {
    errors.membershipId = ['A verified membership is required for this service'];
  }
  if (!isMembershipService && request.membershipId !== undefined) {
    errors.membershipId = ['A membership can only be used for the Membership service'];
  }

  const guests = request.guests ?? 0;
  if (guests > 0 && product.guestPrice === null) {
    errors.guests = ['This product does not offer guest passes'];
  }

  return errors;
}

function checkAttendeeCounts(request: BookingDetailsDto): string | null {
  const adultCount = countByType(request.attendees, AttendeeType.Adult);
  const childCount = countByType(request.attendees, AttendeeType.Child);
  const infantCount = countByType(request.attendees, AttendeeType.Infant);

  const countsMatch =
    adultCount === request.adults &&
    childCount === request.children &&
    infantCount === request.infants;
  if (countsMatch) {
    return null;
  }

  return (
    `Passenger details do not match the counts: expected ${request.adults} adult(s), ` +
    `${request.children} child(ren), ${request.infants} infant(s); received ` +
    `${adultCount}, ${childCount}, ${infantCount}`
  );
}

function countByType(attendees: AttendeeDto[], type: AttendeeType): number {
  return attendees.filter((attendee) => attendee.type === type).length;
}
