import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Contact-us form. Laravel had no server-side validation here. */
export class CreateInquiryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  company?: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string;

  /**
   * Hidden honeypot field kept from the Laravel form. People never see it, so a value means a
   * bot filled the form in.
   */
  @IsOptional()
  @IsString()
  website?: string;
}
