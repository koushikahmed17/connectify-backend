import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class CreateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Display name must not exceed 100 characters' })
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio must not exceed 500 characters' })
  bio?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid website URL' })
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Location must not exceed 100 characters' })
  location?: string;

  @IsOptional()
  avatarId?: number;

  @IsOptional()
  coverPhotoId?: number;
}

export class UpdateProfileDto extends CreateProfileDto {}

export class ProfileResponseDto {
  id: number;
  userId: number;
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  avatar?: {
    id: number;
    url: string;
    mimeType: string;
  };
  coverPhoto?: {
    id: number;
    url: string;
    mimeType: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

