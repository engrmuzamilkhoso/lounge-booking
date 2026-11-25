import { IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';

/** Membership plan shown on the website's membership page, e.g. "Corporate Tariff Plan". */
export interface MembershipTypeResponse {
  id: number;
  name: string;
  /** e.g. 750000 with label "One time Membership Fee". */
  price1: number;
  price1Text: string;
  /** e.g. 1000000 with label "Annual Fee". */
  price2: number;
  price2Text: string;
}

export class SaveMembershipTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price1: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  price1Text: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price2: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  price2Text: string;
}
