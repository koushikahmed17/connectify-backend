import {
  IsString,
  IsOptional,
  MaxLength,
  IsArray,
  IsNumber,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  mediaIds?: number[];
}

