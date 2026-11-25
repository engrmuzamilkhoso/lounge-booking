import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class FindPassQueryDto {
  /** Booking reference, e.g. ML0000201 (when the QR code cannot be scanned). */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[A-Z0-9-]+$/, { message: 'code must contain only letters, digits and dashes' })
  code: string;
}
