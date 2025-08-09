import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  avatarId?: number;

  @IsOptional()
  @IsNumber()
  coverPhotoId?: number;
}
