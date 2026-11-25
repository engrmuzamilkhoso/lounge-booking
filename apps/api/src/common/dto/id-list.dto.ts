import { ArrayNotEmpty, IsArray, IsInt, IsPositive } from 'class-validator';

/** Body of bulk-delete endpoints (Laravel's `massDestroy`). */
export class IdListDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  ids: number[];
}
