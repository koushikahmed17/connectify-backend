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

  // Get profile by userId
  async getProfileByUserId(userId: number) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { avatar: true, coverPhoto: true },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  // Create profile (only if not exists)
  async createProfile(userId: number, dto: CreateProfileDto) {
    const existing = await this.prisma.profile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ForbiddenException('Profile already exists');
    }

    return this.prisma.profile.create({
      data: {
        userId,
        displayName: dto.displayName,
        bio: dto.bio,
        website: dto.website,
        location: dto.location,
        avatarId: dto.avatarId,
        coverPhotoId: dto.coverPhotoId,
      },
    });
  }

  // Update profile (only own profile)
  async updateProfile(userId: number, dto: CreateProfileDto) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.prisma.profile.update({
      where: { userId },
      data: {
        displayName: dto.displayName,
        bio: dto.bio,
        website: dto.website,
        location: dto.location,
        avatarId: dto.avatarId,
        coverPhotoId: dto.coverPhotoId,
      },
    });
  }
}
