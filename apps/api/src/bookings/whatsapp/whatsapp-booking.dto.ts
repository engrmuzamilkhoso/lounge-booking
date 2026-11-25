import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Booking request captured by the mobile app's WhatsApp flow (Laravel
 * `whatsappBookingStore`). Same fields and checks as the Laravel endpoint.
 */
export class CreateWhatsappBookingDto {
  /** Service name as free text, e.g. "Lounge". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  service: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    message: 'departureDate must be in YYYY-MM-DD format',
  })
  departureDate: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/, {
    message: 'departureTime must be in HH:mm:ss format',
  })
  departureTime: string;

  @IsInt()
  @Min(0)
  @Max(20)
  adultQty: number;

  @IsInt()
  @Min(0)
  @Max(20)
  childQty: number;

  @IsInt()
  @Min(0)
  @Max(20)
  infantQty: number;
}

export interface WhatsappBookingResponse {
  id: number;
  service: string;
  amount: number;
  departureDate: string;
  departureTime: string;
  adultQty: number;
  childQty: number;
  infantQty: number;
  createdAt: string | null;
}
