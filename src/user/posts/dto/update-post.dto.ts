import {
  IsString,
  IsOptional,
  MaxLength,
  IsArray,
  IsNumber,
} from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  mediaIds?: number[];
}

