import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SavePermissionDto {
  /** Permission key checked by the API, e.g. `booking_access`. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;
}

export interface PermissionResponse {
  id: number;
  title: string | null;
}
