import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Nationality, booking status or booking source: each is an id and a name. */
export interface LookupResponse {
  id: number;
  name: string;
}

export class SaveNationalityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(225)
  name: string;
}

export class SaveStatusDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;
}

export class SaveSourceRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;
}
