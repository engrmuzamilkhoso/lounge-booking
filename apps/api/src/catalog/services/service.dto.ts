import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Airport service (Laravel `lounge_services`): Meet & Assist, Lounge, Membership, Premier. */
export interface ServiceResponse {
  id: number;
  name: string;
  /** Fields used by the mobile app's service menu. */
  appDescription: string | null;
  appRoute: string | null;
  appIcon: string | null;
  iconForApp: string | null;
}

export class SaveServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  appDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(45)
  appRoute?: string;

  @IsOptional()
  @IsString()
  @MaxLength(45)
  appIcon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  iconForApp?: string;
}
