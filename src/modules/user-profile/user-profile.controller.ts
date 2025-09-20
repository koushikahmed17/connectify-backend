import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { memoryStorage } from 'multer';
import { UserProfileService } from './user-profile.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/user-profile.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUserId } from '../../shared/decorators/current-user-id.decorator';
import { MediaService } from '../media/media.service';
import { ApiResponseDto } from '../../shared/dto/api-response.dto';

@UseGuards(JwtAuthGuard)
@Controller('user/profile')
export class UserProfileController {
  constructor(
    private readonly profileService: UserProfileService,
    private readonly mediaService: MediaService,
  ) {}

  @Get()
  async getProfile(@CurrentUserId() userId: number): Promise<ApiResponseDto> {
    const profile = await this.profileService.getProfileByUserId(userId);
    if (!profile) {
      return ApiResponseDto.success('No profile found', null);
    }
    return ApiResponseDto.success('Profile retrieved successfully', profile);
  }

  @Get('public/:userId')
  async getPublicProfile(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ApiResponseDto> {
    const profile = await this.profileService.getPublicProfile(userId);
    if (!profile) {
      return ApiResponseDto.success('No profile found', null);
    }
    return ApiResponseDto.success(
      'Public profile retrieved successfully',
      profile,
    );
  }

  @Get('search')
  async searchUsers(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponseDto> {
    if (!query || query.trim().length === 0) {
      return ApiResponseDto.success('No search query provided', []);
    }

    const searchLimit = limit ? parseInt(limit, 10) : 10;
    const users = await this.profileService.searchUsers(
      query.trim(),
      searchLimit,
    );

    return ApiResponseDto.success('Users found successfully', users);
  }

  @Get('files')
  async getUserFiles(@CurrentUserId() userId: number): Promise<ApiResponseDto> {
    const files = await this.mediaService.getUserFiles(userId);
    return ApiResponseDto.success('User files retrieved successfully', files);
  }

  @Post('files')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'file', maxCount: 10 }], {
      storage: memoryStorage(),
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit per file
        files: 10,
      },
      fileFilter: (req, file, callback) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv)$/)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException('Only image and video files are allowed!'),
            false,
          );
        }
      },
    }),
  )
  async uploadMedia(
    @CurrentUserId() userId: number,
    @UploadedFiles() files: { file?: Express.Multer.File[] },
  ): Promise<ApiResponseDto> {
    if (!files?.file || files.file.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const file = files.file[0];
    const savedMedia = await this.mediaService.create(file, userId);

    return ApiResponseDto.success('File uploaded successfully', {
      id: savedMedia.id,
      url: savedMedia.url,
      mimeType: savedMedia.mimeType,
      size: savedMedia.size,
    });
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar', maxCount: 1 },
        { name: 'coverPhoto', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: {
          fileSize: 20 * 1024 * 1024, // 20MB limit
          files: 2,
        },
        fileFilter: (req, file, callback) => {
          if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
            callback(null, true);
          } else {
            callback(
              new BadRequestException('Only image files are allowed!'),
              false,
            );
          }
        },
      },
    ),
  )
  async createProfile(
    @CurrentUserId() userId: number,
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
    },
    @Body() body: any,
  ): Promise<ApiResponseDto> {
    const dto: CreateProfileDto = {
      displayName: body.displayName,
      bio: body.bio,
      website: body.website,
      location: body.location,
      avatarId: body.avatarId ? Number(body.avatarId) : undefined,
      coverPhotoId: body.coverPhotoId ? Number(body.coverPhotoId) : undefined,
    };

    let avatarId: number | undefined;
    let coverPhotoId: number | undefined;

    if (files?.avatar && files.avatar.length > 0) {
      const savedAvatar = await this.mediaService.create(
        files.avatar[0],
        userId,
      );
      avatarId = savedAvatar.id;
    }

    if (files?.coverPhoto && files.coverPhoto.length > 0) {
      const savedCover = await this.mediaService.create(
        files.coverPhoto[0],
        userId,
      );
      coverPhotoId = savedCover.id;
    }

    const profile = await this.profileService.createProfile(userId, {
      ...dto,
      avatarId,
      coverPhotoId,
    });

    return ApiResponseDto.success('Profile created successfully', profile);
  }

  @Put()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar', maxCount: 1 },
        { name: 'coverPhoto', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: {
          fileSize: 20 * 1024 * 1024, // 20MB limit
          files: 2,
        },
        fileFilter: (req, file, callback) => {
          if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
            callback(null, true);
          } else {
            callback(
              new BadRequestException('Only image files are allowed!'),
              false,
            );
          }
        },
      },
    ),
  )
  async updateProfile(
    @CurrentUserId() userId: number,
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
    },
    @Body() body: any,
  ): Promise<ApiResponseDto> {
    const dto: UpdateProfileDto = {
      displayName: body.displayName,
      bio: body.bio,
      website: body.website,
      location: body.location,
      avatarId: body.avatarId ? Number(body.avatarId) : undefined,
      coverPhotoId: body.coverPhotoId ? Number(body.coverPhotoId) : undefined,
    };

    if (files?.avatar?.[0]) {
      const savedAvatar = await this.mediaService.create(
        files.avatar[0],
        userId,
      );
      dto.avatarId = savedAvatar.id;
    }

    if (files?.coverPhoto?.[0]) {
      const savedCover = await this.mediaService.create(
        files.coverPhoto[0],
        userId,
      );
      dto.coverPhotoId = savedCover.id;
    }

    const profile = await this.profileService.updateProfile(userId, dto);
    return ApiResponseDto.success('Profile updated successfully', profile);
  }
}
