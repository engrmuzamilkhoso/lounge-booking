import type {
  AttendeeType,
  BookingPaymentStatus,
  PassStatus,
  PaymentStatus,
} from '@booking/shared-types';

/** Shapes returned by the NestJS API (see apps/api, Swagger at /api/docs). */

export interface Product {
  id: number;
  name: string | null;
  description: string | null;
  serviceId: number;
  categoryId: number;
  service: { id: number; name: string };
  category: { id: number; name: string | null };
  price: number | null;
  adultLimit: number;
  childPrice: number;
  childLimit: number;
  infantPrice: number;
  infantLimit: number;
  guestPrice: number | null;
}

export interface ProductCategory {
  id: number;
  name: string | null;
  description: string | null;
}

export interface BankCard {
  id: number;
  name: string;
  detail: string;
  bin: string;
  isActive: boolean;
}

export interface Lookup {
  id: number;
  name: string;
}

export interface MembershipType {
  id: number;
  name: string;
  price1: number;
  price1Text: string;
  price2: number;
  price2Text: string;
}

export interface MembershipVerification {
  membershipId: number;
  serialNo: string;
  remainingVisits: number;
}

export interface Attendee {
  id: number;
  type: AttendeeType;
  name: string;
  dob: string;
  nationality: string | null;
  address: string | null;
  passportCnic: string | null;
  passportCnicExpiry: string | null;
  contactNo: string | null;
  email: string | null;
  guardianContact: string | null;
}

export interface PaymentSummary {
  id: number;
  status: PaymentStatus;
  amount: number;
  currency: string;
  gateway: string;
  reference: string;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
}

/** The customer's lounge pass (QR code). Null until the booking is paid. */
export interface BookingPass {
  token: string;
  status: PassStatus;
  checkedInAt: string | null;
}

export interface Booking {
  id: number;
  code: string;
  service: { id: number; name: string };
  product: { id: number; name: string | null } | null;
  category: { id: number; name: string | null } | null;
  source: { id: number; name: string } | null;
  customer: { id: number; firstName: string | null; lastName: string | null; email: string } | null;
  flightNumber: string;
  flightDetail: string | null;
  departureDate: string;
  departureTime: string | null;
  adults: number;
  children: number;
  infants: number;
  guests: number;
  totalAmount: number | null;
  paymentStatus: BookingPaymentStatus;
  payments: PaymentSummary[];
  pass: BookingPass | null;
  bankCard: { id: number; name: string } | null;
  membership: { id: number; serialNo: string } | null;
  createdAt: string | null;
  attendees: Attendee[];
}

export interface PaymentConfirmation {
  bookingId: number;
  bookingCode: string;
  bookingPaymentStatus: BookingPaymentStatus;
  paymentStatus: PaymentStatus;
}

/** Staff view of a scanned pass (GET /admin/booking-passes/:token). */
export interface PassVerification {
  status: PassStatus;
  departsToday: boolean;
  checkedInAt: string | null;
  checkedInBy: { id: number; name: string } | null;
  booking: Booking;
}
