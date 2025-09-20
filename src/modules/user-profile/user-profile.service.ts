import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  CreateProfileDto,
  UpdateProfileDto,
  ProfileResponseDto,
} from './dto/user-profile.dto';
import {
  ProfileNotFoundException,
  ResourceAlreadyExistsException,
} from '../../shared/exceptions/business.exceptions';

@Injectable()
export class UserProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfileByUserId(userId: number): Promise<ProfileResponseDto | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        avatar: true,
        coverPhoto: true,
      },
    });

    if (!profile) {
      return null;
    }

    return this.formatProfileResponse(profile);
  }

  async getPublicProfile(userId: number): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            avatar: true,
            coverPhoto: true,
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      profile: user.profile ? this.formatProfileResponse(user.profile) : null,
      postsCount: user._count.posts,
    };
  }

  async createProfile(
    userId: number,
    dto: CreateProfileDto & { avatarId?: number; coverPhotoId?: number },
  ): Promise<ProfileResponseDto> {
    const existing = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ResourceAlreadyExistsException('Profile already exists');
    }

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

    return this.formatProfileResponse(createdProfile);
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new ProfileNotFoundException();
    }

    const updatedProfile = await this.prisma.profile.update({
      where: { userId },
      data: {
        displayName: dto.displayName,
        bio: dto.bio,
        website: dto.website,
        location: dto.location,
        avatarId: dto.avatarId !== undefined ? dto.avatarId : profile.avatarId,
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

    return this.formatProfileResponse(updatedProfile);
  }

  async searchUsers(query: string, limit: number = 10): Promise<any[]> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          {
            username: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            profile: {
              displayName: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
        ],
        deletedAt: null, // Exclude soft-deleted users
      },
      include: {
        profile: {
          include: {
            avatar: true,
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
      take: limit,
      orderBy: {
        username: 'asc',
      },
    });

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      displayName: user.profile?.displayName || user.username,
      avatar: user.profile?.avatar
        ? {
            id: user.profile.avatar.id,
            url: user.profile.avatar.url,
            mimeType: user.profile.avatar.mimeType,
          }
        : null,
      postsCount: user._count.posts,
      createdAt: user.createdAt,
    }));
  }

  private formatProfileResponse(profile: any): ProfileResponseDto {
    return {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName,
      bio: profile.bio,
      website: profile.website,
      location: profile.location,
      avatar: profile.avatar
        ? {
            id: profile.avatar.id,
            url: profile.avatar.url,
            mimeType: profile.avatar.mimeType,
          }
        : undefined,
      coverPhoto: profile.coverPhoto
        ? {
            id: profile.coverPhoto.id,
            url: profile.coverPhoto.url,
            mimeType: profile.coverPhoto.mimeType,
          }
        : undefined,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
