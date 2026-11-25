import { IsInt, IsNotEmpty, IsPositive, IsString, MaxLength } from 'class-validator';

export interface FaqCategoryResponse {
  id: number;
  name: string | null;
}

export interface FaqQuestionResponse {
  id: number;
  question: string | null;
  answer: string | null;
  category: FaqCategoryResponse | null;
}

export class SaveFaqCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class SaveFaqQuestionDto {
  @IsInt()
  @IsPositive()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;
}
