import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export interface ProductResponse {
  id: number;
  name: string | null;
  description: string | null;
  serviceId: number;
  categoryId: number;
  service: { id: number; name: string };
  category: { id: number; name: string | null };
  /** Price per adult, PKR. */
  price: number | null;
  adultLimit: number;
  childPrice: number;
  /** Number of children included free of charge. */
  childLimit: number;
  infantPrice: number;
  /** Number of infants included free of charge. */
  infantLimit: number;
  /** Price per guest; null when the product has no guest option. */
  guestPrice: number | null;
}

export class ListProductsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  serviceId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoryId?: number;
}

/** Laravel's admin product form: all prices and limits are required. */
export class SaveProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @IsPositive()
  serviceId: number;

  @IsInt()
  @IsPositive()
  categoryId: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsInt()
  @Min(0)
  adultLimit: number;

  @IsInt()
  @Min(0)
  childPrice: number;

  @IsInt()
  @Min(0)
  childLimit: number;

  @IsInt()
  @Min(0)
  infantPrice: number;

  @IsInt()
  @Min(0)
  infantLimit: number;

  /** Leave out (or null) for products without a guest option. */
  @IsOptional()
  @IsInt()
  @Min(0)
  guestPrice?: number | null;
}
