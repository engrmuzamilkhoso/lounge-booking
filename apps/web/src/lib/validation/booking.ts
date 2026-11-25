import { AttendeeType } from '@booking/shared-types';
import { z } from 'zod';

/**
 * Booking form rules, mirroring the API (apps/api/src/bookings/dto). Required passenger fields
 * follow the Laravel booking form: adults give ID and contact details, children and infants a
 * guardian's phone number.
 *
 * Every passenger has the same (flat) set of fields so the form can address them by path;
 * which ones are required depends on the passenger type.
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const passengerSchema = z
  .object({
    type: z.union([
      z.literal(AttendeeType.Adult),
      z.literal(AttendeeType.Child),
      z.literal(AttendeeType.Infant),
    ]),
    name: z.string().trim().min(1, 'Enter the full name').max(255),
    dob: z.string().regex(DATE_ONLY, 'Choose the date of birth'),
    nationality: z.string().trim().min(1, 'Choose a nationality').max(100),
    address: z.string().trim().min(1, 'Enter the address').max(500),
    passportCnic: z.string().trim().max(255),
    passportCnicExpiry: z.string(),
    contactNo: z.string().trim().max(100),
    email: z.string().trim().max(255),
    guardianContact: z.string().trim().max(100),
  })
  .superRefine((passenger, context) => {
    const require = (field: keyof typeof passenger, isMissing: boolean, message: string) => {
      if (isMissing) {
        context.addIssue({ code: 'custom', path: [field], message });
      }
    };

    if (passenger.type === AttendeeType.Adult) {
      const hasExpiryDate = DATE_ONLY.test(passenger.passportCnicExpiry);
      const hasValidEmail = z.email().safeParse(passenger.email).success;
      require('passportCnic', passenger.passportCnic === '', 'Enter the CNIC or passport number');
      require('passportCnicExpiry', !hasExpiryDate, 'Choose the expiry date');
      require('contactNo', passenger.contactNo === '', 'Enter a phone number');
      require('email', !hasValidEmail, 'Enter a valid email address');
      return;
    }
    require('guardianContact', passenger.guardianContact === '', "Enter a guardian's phone number");
  });
export type PassengerValues = z.infer<typeof passengerSchema>;

export const bookingFormSchema = z.object({
  productId: z.number().int().positive(),
  flightNumber: z.string().trim().min(1, 'Enter the flight number').max(255),
  departureDate: z.string().regex(DATE_ONLY, 'Choose the departure date'),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Choose the departure time'),
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(20),
  infants: z.number().int().min(0).max(20),
  guests: z.number().int().min(0).max(20),
  bankCardId: z.number().int().positive().optional(),
  membershipId: z.number().int().positive().optional(),
  expectedTotalAmount: z.number().min(0),
  attendees: z.array(passengerSchema).max(60),
});
export type BookingFormValues = z.infer<typeof bookingFormSchema>;

/** The passenger as the API expects it: only the fields that apply to its type. */
export function toApiPassenger(passenger: PassengerValues): Record<string, string | number> {
  const common = {
    type: passenger.type,
    name: passenger.name,
    dob: passenger.dob,
    nationality: passenger.nationality,
    address: passenger.address,
  };
  if (passenger.type === AttendeeType.Adult) {
    return {
      ...common,
      passportCnic: passenger.passportCnic,
      passportCnicExpiry: passenger.passportCnicExpiry,
      contactNo: passenger.contactNo,
      email: passenger.email,
    };
  }
  return { ...common, guardianContact: passenger.guardianContact };
}
