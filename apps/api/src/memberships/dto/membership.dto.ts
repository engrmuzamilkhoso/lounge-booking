import { Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { MembershipStatus } from '@booking/shared-types';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto.js';

export interface MembershipResponse {
  id: number;
  membershipType: { id: number; name: string } | null;
  name: string;
  /** YYYY-MM-DD */
  dob: string;
  contactNo: string;
  email: string;
  address: string | null;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  membershipDeclaration: boolean;
  /** 1 = pending application, 2 = approved. */
  status: MembershipStatus;
  /** 8-digit membership number; null until approved. */
  serialNo: string | null;
  product: { id: number; name: string | null } | null;
  visitLimit: number | null;
  /** Bookings made with this membership. */
  usedVisits: number;
}

export interface MembershipVerificationResponse {
  membershipId: number;
  serialNo: string;
  remainingVisits: number;
}

/** Shared personal-detail fields of the website application form and the admin form. */
class MembershipDetailsDto {
  @IsInt()
  @IsPositive()
  membershipTypeId: number;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dob must be in YYYY-MM-DD format' })
  dob: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  contactNo: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  zipcode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;
}

/**
 * Website membership application (Laravel `membershipCreate`). Same required fields as the
 * form's validation; first and last name are stored together in `name`, as Laravel did.
 */
export class ApplyForMembershipDto extends MembershipDetailsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  lastName: string;

  /** The applicant must accept the declaration. */
  @IsBoolean()
  @Equals(true, { message: 'membershipDeclaration must be accepted' })
  membershipDeclaration: boolean;
}

export class VerifyMembershipDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  serialNo: string;
}

/** Admin create/edit of a membership's details. Approval has its own endpoint. */
export class SaveMembershipDto extends MembershipDetailsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsBoolean()
  membershipDeclaration?: boolean;
}

export class ApproveMembershipDto {
  @IsString()
  @Matches(/^\d{1,200}$/, { message: 'serialNo must contain digits only' })
  serialNo: string;

  /** Must be a membership product (category "International-domestic"), as in Laravel's form. */
  @IsInt()
  @IsPositive()
  productId: number;

  @IsInt()
  @Min(1)
  visitLimit: number;
}

/** `search` matches name, email, contact number and membership number. */
export class ListMembershipsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsIn([MembershipStatus.Pending, MembershipStatus.Approved])
  status?: MembershipStatus;
}
