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
  Req,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UserProfileService } from './userprofile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserId } from '../../common/decorators/user.decorator';
import { MediaService } from '../../media/media.service';
import { Express } from 'express';
import { memoryStorage } from 'multer';

@UseGuards(JwtAuthGuard)
@Controller('user/profile')
export class UserProfileController {
  constructor(
    private readonly profileService: UserProfileService,
    private readonly mediaService: MediaService,
  ) {}

  @Get()
  async getProfile(@CurrentUserId() userId: number) {
    return this.profileService.getProfileByUserId(userId);
  }

  @Post('test')
  async testProfile(@CurrentUserId() userId: number, @Body() body: any) {
    console.log('🧪 Test profile endpoint called');
    console.log('📝 Body:', body);
    console.log('👤 User ID:', userId);
    return { message: 'Test successful', body, userId };
  }

  // New endpoint to get user's uploaded files
  @Get('files')
  async getUserFiles(@CurrentUserId() userId: number) {
    console.log('📁 Getting uploaded files for userId:', userId);
    return this.mediaService.getUserFiles(userId);
  }

  // New endpoint to upload media files for posts
  @Post('files')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'file', maxCount: 10 }], // Allow up to 10 files
      {
        storage: memoryStorage(),
        limits: {
          fileSize: 20 * 1024 * 1024, // 20MB limit per file
          files: 10,
        },
        fileFilter: (req, file, callback) => {
          console.log('🔍 Media upload file filter:', {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
          });

          // Allow image and video files
          if (
            file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv)$/)
          ) {
            callback(null, true);
          } else {
            callback(
              new BadRequestException(
                'Only image and video files are allowed!',
              ),
              false,
            );
          }
        },
      },
    ),
  )
  async uploadMedia(
    @CurrentUserId() userId: number,
    @UploadedFiles() files: { file?: Express.Multer.File[] },
  ) {
    console.log('📤 Media upload request for userId:', userId);
    console.log('📂 Uploaded files:', files);

    if (!files?.file || files.file.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // For single file upload, return the first file
    const file = files.file[0];
    console.log('➡️ Processing file:', file.originalname);

    try {
      const savedMedia = await this.mediaService.create(file, userId);
      console.log('✅ Media saved with ID:', savedMedia.id);

      return {
        id: savedMedia.id,
        url: savedMedia.url,
        mimeType: savedMedia.mimeType,
        size: savedMedia.size,
      };
    } catch (error) {
      console.error('❌ Error uploading media:', error);
      throw error;
    }
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar', maxCount: 1 },
        { name: 'coverPhoto', maxCount: 1 },
      ],
      {
        storage: memoryStorage(), // Explicitly use memory storage
        limits: {
          fileSize: 20 * 1024 * 1024, // 20MB limit
          files: 2,
        },
        fileFilter: (req, file, callback) => {
          console.log('🔍 File filter called:', {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
          });

          // Allow only image files
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
    @Body() body: any, // accept raw form fields as strings
    @Req() req: any, // Add request object for debugging
  ) {
    console.log('🟢 Received Create Profile request for userId:', userId);
    console.log('📂 Raw request headers:', req.headers);
    console.log('📂 Content-Type:', req.headers['content-type']);
    console.log('📂 Uploaded files structure:', JSON.stringify(files, null, 2));
    console.log('📂 Files keys:', Object.keys(files || {}));
    console.log('📂 Files type:', typeof files);
    console.log('📝 Body:', body);
    console.log('📝 Body type:', typeof body);
    console.log('📂 Request body keys:', Object.keys(req.body || {}));

    // Debug: Log individual file arrays
    if (files) {
      console.log('🔍 Avatar files:', files.avatar);
      console.log('🔍 Cover photo files:', files.coverPhoto);
    } else {
      console.log('❌ Files object is null/undefined');
    }

    // The form fields arrive as strings (e.g. body.displayName is string)
    // Convert fields to the expected DTO shape:
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

    try {
      // Save avatar file in media table
      if (files?.avatar && files.avatar.length > 0) {
        console.log('➡️ Saving avatar file:', files.avatar[0].originalname);
        console.log('➡️ Avatar file details:', {
          originalname: files.avatar[0].originalname,
          mimetype: files.avatar[0].mimetype,
          size: files.avatar[0].size,
          buffer: files.avatar[0].buffer ? 'Buffer exists' : 'No buffer',
        });
        const savedAvatar = await this.mediaService.create(
          files.avatar[0],
          userId,
        ); // Pass userId
        console.log('✅ Avatar saved with ID:', savedAvatar.id);
        avatarId = savedAvatar.id;
      } else {
        console.warn('⚠️ No avatar file uploaded.');
      }

      // Save cover photo file in media table
      if (files?.coverPhoto && files.coverPhoto.length > 0) {
        console.log(
          '➡️ Saving cover photo file:',
          files.coverPhoto[0].originalname,
        );
        console.log('➡️ Cover photo file details:', {
          originalname: files.coverPhoto[0].originalname,
          mimetype: files.coverPhoto[0].mimetype,
          size: files.coverPhoto[0].size,
          buffer: files.coverPhoto[0].buffer ? 'Buffer exists' : 'No buffer',
        });
        const savedCover = await this.mediaService.create(
          files.coverPhoto[0],
          userId,
        ); // Pass userId
        console.log('✅ Cover photo saved with ID:', savedCover.id);
        coverPhotoId = savedCover.id;
      } else {
        console.warn('⚠️ No cover photo file uploaded.');
      }

      // Create user profile with media IDs
      return await this.profileService.createProfile(userId, {
        ...dto,
        avatarId,
        coverPhotoId,
      });
    } catch (error) {
      console.error('❌ Error creating profile:', error);
      throw error;
    }
  }

  @Put()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar', maxCount: 1 },
        { name: 'coverPhoto', maxCount: 1 },
      ],
      {
        storage: memoryStorage(), // Explicitly use memory storage
        limits: {
          fileSize: 20 * 1024 * 1024, // 20MB limit
          files: 2,
        },
        fileFilter: (req, file, callback) => {
          // Allow only image files
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
    @Body() body: any, // accept raw form fields as strings
  ) {
    console.log('🟡 Received Update Profile request for userId:', userId);
    console.log('📂 Update files:', files);
    console.log('📝 Update body:', body);

    // The form fields arrive as strings (e.g. body.displayName is string)
    // Convert fields to the expected DTO shape:
    const dto: CreateProfileDto = {
      displayName: body.displayName,
      bio: body.bio,
      website: body.website,
      location: body.location,
      avatarId: body.avatarId ? Number(body.avatarId) : undefined,
      coverPhotoId: body.coverPhotoId ? Number(body.coverPhotoId) : undefined,
    };

    try {
      // Override avatarId if file uploaded
      if (files?.avatar?.[0]) {
        console.log('➡️ Updating avatar file:', files.avatar[0].originalname);
        const savedAvatar = await this.mediaService.create(
          files.avatar[0],
          userId,
        ); // Pass userId
        console.log('✅ New avatar saved with ID:', savedAvatar.id);
        dto.avatarId = savedAvatar.id;
      }

      // Override coverPhotoId if file uploaded
      if (files?.coverPhoto?.[0]) {
        console.log(
          '➡️ Updating cover photo file:',
          files.coverPhoto[0].originalname,
        );
        const savedCover = await this.mediaService.create(
          files.coverPhoto[0],
          userId,
        ); // Pass userId
        console.log('✅ New cover photo saved with ID:', savedCover.id);
        dto.coverPhotoId = savedCover.id;
      }

      return await this.profileService.updateProfile(userId, dto);
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }
  }
}
