import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { AttendeeType } from '@booking/shared-types';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_ONLY_MESSAGE = 'must be a date in YYYY-MM-DD format';

function isAdult(attendee: AttendeeDto): boolean {
  return attendee.type === AttendeeType.Adult;
}

function isChildOrInfant(attendee: AttendeeDto): boolean {
  return attendee.type === AttendeeType.Child || attendee.type === AttendeeType.Infant;
}

/**
 * One passenger on a booking (Laravel `booking_details`).
 * Required fields follow Laravel's booking form:
 * - adult: name, date of birth, CNIC/passport and its expiry, contact, email, nationality, address
 * - child / infant: name, date of birth, nationality, address, guardian's contact
 */
export class AttendeeDto {
  /** 1 = adult, 2 = child, 3 = infant */
  @IsIn([AttendeeType.Adult, AttendeeType.Child, AttendeeType.Infant])
  type: AttendeeType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Matches(DATE_ONLY, { message: `dob ${DATE_ONLY_MESSAGE}` })
  dob: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nationality: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @ValidateIf(isAdult)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  passportCnic?: string;

  @ValidateIf(isAdult)
  @Matches(DATE_ONLY, { message: `passportCnicExpiry ${DATE_ONLY_MESSAGE}` })
  passportCnicExpiry?: string;

  @ValidateIf(isAdult)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contactNo?: string;

  @ValidateIf(isAdult)
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ValidateIf(isChildOrInfant)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  guardianContact?: string;
}

/** Admin edits of an existing passenger; the passenger type cannot change. */
export class UpdateAttendeeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @Matches(DATE_ONLY, { message: `dob ${DATE_ONLY_MESSAGE}` })
  dob?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  passportCnic?: string;

  @IsOptional()
  @Matches(DATE_ONLY, { message: `passportCnicExpiry ${DATE_ONLY_MESSAGE}` })
  passportCnicExpiry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactNo?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  guardianContact?: string;
}
