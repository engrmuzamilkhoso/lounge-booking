import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Domestic / International / International-domestic. */
export interface ProductCategoryResponse {
  id: number;
  name: string | null;
  description: string | null;
}

export class SaveProductCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
