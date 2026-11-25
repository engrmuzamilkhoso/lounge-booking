import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto.js';
import { AttendeeDto } from './attendee.dto.js';

/** Upper bound per passenger type; a sanity limit, not a business rule from Laravel. */
export const MAX_PASSENGERS_PER_TYPE = 20;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
/** "22:50" or "22:50:00" */
const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/** Fields shared by customer bookings and bookings created by staff. */
export class BookingDetailsDto {
  /** Service and category are taken from the product, not from the client. */
  @IsInt()
  @IsPositive()
  productId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  flightNumber: string;

  /** Local (Pakistan) date of the flight. */
  @Matches(DATE_ONLY, { message: 'departureDate must be a date in YYYY-MM-DD format' })
  departureDate: string;

  /** Local (Pakistan) time of the flight. */
  @Matches(TIME_OF_DAY, { message: 'departureTime must be a time in HH:mm format' })
  departureTime: string;

  @IsInt()
  @Min(1)
  @Max(MAX_PASSENGERS_PER_TYPE)
  adults: number;

  @IsInt()
  @Min(0)
  @Max(MAX_PASSENGERS_PER_TYPE)
  children: number;

  @IsInt()
  @Min(0)
  @Max(MAX_PASSENGERS_PER_TYPE)
  infants: number;

  /** Only for products with a guest price (Premier Services). Guests have no passenger details. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PASSENGERS_PER_TYPE)
  guests?: number;

  /** Required for the Lounge service: the bank card that gives lounge access. */
  @IsOptional()
  @IsInt()
  @IsPositive()
  bankCardId?: number;

  /** Required for the Membership service: the id returned by `POST /memberships/verify`. */
  @IsOptional()
  @IsInt()
  @IsPositive()
  membershipId?: number;

  /** One entry per adult, child and infant. */
  @IsArray()
  @ArrayMaxSize(MAX_PASSENGERS_PER_TYPE * 3)
  @ValidateNested({ each: true })
  @Type(() => AttendeeDto)
  attendees: AttendeeDto[];
}

export class CreateBookingDto extends BookingDetailsDto {
  /** Which client made the booking; stored as the booking source (Web / App). */
  @IsIn(['web', 'app'])
  platform: 'web' | 'app';

  /**
   * The total the customer was shown. The API calculates the price itself and rejects the
   * booking with `0019 Price-Mismatch` if they differ, so nobody is charged an unseen amount.
   */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  expectedTotalAmount: number;
}

/** Staff booking on behalf of a customer (Laravel admin "create booking"). */
export class AdminCreateBookingDto extends BookingDetailsDto {
  @IsInt()
  @IsPositive()
  customerId: number;
}

/**
 * Staff edits of a booking's travel details. Product and passenger counts are not editable;
 * passengers are managed with the attendee endpoints.
 */
export class UpdateBookingDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  flightNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  flightDetail?: string;

  @IsOptional()
  @Matches(DATE_ONLY, { message: 'departureDate must be a date in YYYY-MM-DD format' })
  departureDate?: string;

  @IsOptional()
  @Matches(TIME_OF_DAY, { message: 'departureTime must be a time in HH:mm format' })
  departureTime?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  bankCardId?: number;
}

/** `search` matches booking code, flight number and the customer's name or email. */
export class ListBookingsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  serviceId?: number;

  @IsOptional()
  @Matches(DATE_ONLY, { message: 'departureFrom must be a date in YYYY-MM-DD format' })
  departureFrom?: string;

  @IsOptional()
  @Matches(DATE_ONLY, { message: 'departureTo must be a date in YYYY-MM-DD format' })
  departureTo?: string;
}
