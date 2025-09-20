import { IsString, IsOptional, MaxLength, IsNumber } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @MaxLength(50)
  displayName: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @IsNumber()
  avatarId?: number;

  @IsOptional()
  @IsNumber()
  coverPhotoId?: number;
}
