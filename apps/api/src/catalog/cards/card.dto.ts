import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/** Bank card that gives lounge access; the customer picks one when booking the Lounge service. */
export interface CardResponse {
  id: number;
  name: string;
  detail: string;
  /** First digits of the card number that identify the issuing bank's card product. */
  bin: string;
  sortOrder: number | null;
  isActive: boolean;
}

export class SaveCardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  detail: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  bin: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
