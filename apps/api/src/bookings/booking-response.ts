import type { AttendeeType, BookingPaymentStatus, PaymentStatus } from '@booking/shared-types';
import { formatDateOnly } from '../common/date-only.js';
import type { Prisma } from '../generated/prisma/client.js';

export interface AttendeeResponse {
  id: number;
  /** 1 = adult, 2 = child, 3 = infant */
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
  /** PKR, converted from the smallest unit sent to the gateway. */
  amount: number;
  currency: string;
  gateway: string;
  /** Gateway reference (Safepay tracker) — quote it to Safepay support. */
  reference: string;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface BookingResponse {
  id: number;
  /** Booking reference shown to customers, e.g. "ML0000201". */
  code: string;
  service: { id: number; name: string };
  product: { id: number; name: string | null } | null;
  category: { id: number; name: string | null } | null;
  source: { id: number; name: string } | null;
  customer: { id: number; firstName: string | null; lastName: string | null; email: string } | null;
  flightNumber: string;
  flightDetail: string | null;
  /** YYYY-MM-DD, local time. */
  departureDate: string;
  /** HH:mm, local time. */
  departureTime: string | null;
  adults: number;
  children: number;
  infants: number;
  guests: number;
  /** PKR */
  totalAmount: number | null;
  /** not_required (free or settled offline) | pending | paid | failed | refunded */
  paymentStatus: BookingPaymentStatus;
  /** Online payment attempts, newest first. */
  payments: PaymentSummary[];
  bankCard: { id: number; name: string } | null;
  membership: { id: number; serialNo: string } | null;
  createdAt: string | null;
  attendees: AttendeeResponse[];
}

export const attendeeSelect = {
  id: true,
  attendeeType: true,
  name: true,
  dob: true,
  nationality: true,
  address: true,
  passportCnic: true,
  passportCnicExpiry: true,
  contactNo: true,
  email: true,
  guardianContact: true,
} satisfies Prisma.BookingAttendeeSelect;

export const bookingSelect = {
  id: true,
  code: true,
  flightNumber: true,
  flightDetail: true,
  departureDate: true,
  departureTime: true,
  adultQty: true,
  childQty: true,
  infantQty: true,
  guestQty: true,
  totalAmount: true,
  paymentStatus: true,
  createdAt: true,
  service: { select: { id: true, name: true } },
  product: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  sourceRequest: { select: { id: true, name: true } },
  customer: { select: { id: true, firstName: true, lastName: true, email: true } },
  bankCard: { select: { id: true, name: true } },
  membership: { select: { id: true, serialNo: true } },
  attendees: {
    where: { deletedAt: null },
    select: attendeeSelect,
    orderBy: [{ attendeeType: 'asc' }, { id: 'asc' }],
  },
  payments: {
    select: {
      id: true,
      status: true,
      amountMinor: true,
      currency: true,
      gateway: true,
      gatewayReference: true,
      paymentMethod: true,
      paidAt: true,
      createdAt: true,
    },
    orderBy: { id: 'desc' },
  },
} satisfies Prisma.BookingSelect;

type BookingRecord = Prisma.BookingGetPayload<{ select: typeof bookingSelect }>;
type AttendeeRecord = Prisma.BookingAttendeeGetPayload<{ select: typeof attendeeSelect }>;

/** `time` columns come back as a Date on 1970-01-01 UTC. → "22:50" */
export function formatTimeOfDay(value: Date): string {
  return value.toISOString().slice(11, 16);
}

/** Same as formatTimeOfDay, including seconds. → "22:50:00" */
export function formatTimeOfDayWithSeconds(value: Date): string {
  return value.toISOString().slice(11, 19);
}

/** "22:50" or "22:50:00" → Date on 1970-01-01 UTC, for a `time` column. */
export function parseTimeOfDay(value: string): Date {
  const withSeconds = value.length === 5 ? `${value}:00` : value;
  return new Date(`1970-01-01T${withSeconds}.000Z`);
}

export function toAttendeeResponse(attendee: AttendeeRecord): AttendeeResponse {
  return {
    id: attendee.id,
    // The database CHECK constraint limits attendee_type to 1, 2 or 3.
    type: attendee.attendeeType as AttendeeType,
    name: attendee.name,
    dob: formatDateOnly(attendee.dob),
    nationality: attendee.nationality,
    address: attendee.address,
    passportCnic: attendee.passportCnic,
    passportCnicExpiry: attendee.passportCnicExpiry,
    contactNo: attendee.contactNo,
    email: attendee.email,
    guardianContact: attendee.guardianContact,
  };
}

export function toBookingResponse(booking: BookingRecord): BookingResponse {
  return {
    id: booking.id,
    code: booking.code,
    service: booking.service,
    product: booking.product,
    category: booking.category,
    source: booking.sourceRequest,
    customer: booking.customer,
    flightNumber: booking.flightNumber,
    flightDetail: booking.flightDetail,
    departureDate: formatDateOnly(booking.departureDate),
    departureTime: booking.departureTime === null ? null : formatTimeOfDay(booking.departureTime),
    adults: booking.adultQty ?? 0,
    children: booking.childQty ?? 0,
    infants: booking.infantQty ?? 0,
    guests: booking.guestQty ?? 0,
    totalAmount: booking.totalAmount,
    // CHECK constraints limit both status columns to the documented values.
    paymentStatus: booking.paymentStatus as BookingPaymentStatus,
    payments: booking.payments.map((payment) => ({
      id: payment.id,
      status: payment.status as PaymentStatus,
      amount: payment.amountMinor / 100,
      currency: payment.currency,
      gateway: payment.gateway,
      reference: payment.gatewayReference,
      paymentMethod: payment.paymentMethod,
      paidAt: payment.paidAt === null ? null : payment.paidAt.toISOString(),
      createdAt: payment.createdAt.toISOString(),
    })),
    bankCard: booking.bankCard,
    membership: booking.membership,
    createdAt: booking.createdAt === null ? null : booking.createdAt.toISOString(),
    attendees: booking.attendees.map(toAttendeeResponse),
  };
}
