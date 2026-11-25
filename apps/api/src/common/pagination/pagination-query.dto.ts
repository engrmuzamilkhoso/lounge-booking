import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const MAX_PAGE_SIZE = 100;

export class PaginationQueryDto {
  /** 1-based page number. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize = 20;

  /** Free-text filter; each endpoint documents which fields it searches. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  get skip(): number {
    return (this.page - 1) * this.pageSize;
  }
}
