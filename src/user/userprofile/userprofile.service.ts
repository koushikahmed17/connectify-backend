import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';

@Injectable()
export class UserProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfileByUserId(userId: number) {
    console.log('🔍 Getting profile for userId:', userId);

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        avatar: true,
        coverPhoto: true,
      },
    });

    if (!profile) {
      console.warn('⚠️ No profile found for userId:', userId);
      return null; // Return null instead of empty array for better consistency
    }

    console.log('✅ Profile found:', profile);
    return profile;
  }

  async createProfile(
    userId: number,
    dto: CreateProfileDto & { avatarId?: number; coverPhotoId?: number },
  ) {
    console.log('🔍 Checking if profile exists for userId:', userId);

    const existing = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (existing) {
      console.error('❌ Profile already exists for userId:', userId);
      throw new ForbiddenException('Profile already exists');
    }

    console.log('📦 Creating profile with data:', dto);

    try {
      const createdProfile = await this.prisma.profile.create({
        data: {
          userId,
          displayName: dto.displayName,
          bio: dto.bio,
          website: dto.website,
          location: dto.location,
          avatarId: dto.avatarId || null,
          coverPhotoId: dto.coverPhotoId || null,
        },
        include: {
          avatar: true,
          coverPhoto: true,
        },
      });

      console.log('✅ Profile created successfully:', createdProfile);
      return createdProfile;
    } catch (error) {
      console.error('❌ Error creating profile in database:', error);
      throw error;
    }
  }

  async updateProfile(userId: number, dto: CreateProfileDto) {
    console.log('🔍 Updating profile for userId:', userId);
    console.log('📝 Update data:', dto);

    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      console.error('❌ Profile not found for userId:', userId);
      throw new NotFoundException('Profile not found');
    }

    try {
      const updatedProfile = await this.prisma.profile.update({
        where: { userId },
        data: {
          displayName: dto.displayName,
          bio: dto.bio,
          website: dto.website,
          location: dto.location,
          avatarId:
            dto.avatarId !== undefined ? dto.avatarId : profile.avatarId,
          coverPhotoId:
            dto.coverPhotoId !== undefined
              ? dto.coverPhotoId
              : profile.coverPhotoId,
        },
        include: {
          avatar: true,
          coverPhoto: true,
        },
      });

      console.log('✅ Profile updated successfully:', updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('❌ Error updating profile in database:', error);
      throw error;
    }
  }
}
