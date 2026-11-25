import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class SaveRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  /** Laravel required at least one permission per role. */
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  permissionIds: number[];
}

export interface RoleResponse {
  id: number;
  title: string | null;
  permissions: { id: number; title: string | null }[];
}
