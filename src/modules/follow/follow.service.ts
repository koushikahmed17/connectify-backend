import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateFollowRequestDto,
  UpdateFollowRequestDto,
} from './dto/follow.dto';

@Injectable()
export class FollowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Send follow request
  async sendFollowRequest(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    // Check if user exists
    const followingUser = await this.prisma.user.findUnique({
      where: { id: followingId },
      include: { profile: true },
    });

    if (!followingUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already connected
    const existingConnection = await this.prisma.connection.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingConnection) {
      throw new ConflictException('Already following this user');
    }

    // Check if follow request already exists
    const existingRequest = await this.prisma.followRequest.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        throw new ConflictException('Follow request already pending');
      }
      if (existingRequest.status === 'ACCEPTED') {
        // Clean up orphaned ACCEPTED follow request
        await this.prisma.followRequest.delete({
          where: { id: existingRequest.id },
        });
        // Continue with creating new follow request
      }
    }

    // Create follow request
    const followRequest = await this.prisma.followRequest.create({
      data: {
        followerId,
        followingId,
        status: 'PENDING',
      },
      include: {
        follower: {
          include: { profile: true },
        },
        following: {
          include: { profile: true },
        },
      },
    });

    // Create notification for the user being followed
    try {
      const notification = await this.notificationsService.createNotification({
        userId: followingId,
        actorId: followerId,
        type: 'NEW_FOLLOW_REQUEST',
        payload: {
          title: 'New Follow Request',
          message: 'sent you a follow request',
          followRequestId: followRequest.id,
        },
      });
    } catch (error) {
      console.error('Failed to create follow request notification:', error);
      // Don't fail the follow request if notification fails
    }

    return followRequest;
  }

  // Accept follow request
  async acceptFollowRequest(requestId: number, followingId: number) {
    const followRequest = await this.prisma.followRequest.findFirst({
      where: {
        id: requestId,
        followingId,
        status: 'PENDING',
      },
      include: {
        follower: {
          include: { profile: true },
        },
        following: {
          include: { profile: true },
        },
      },
    });

    if (!followRequest) {
      throw new NotFoundException(
        'Follow request not found or already processed',
      );
    }

    // Update follow request status
    await this.prisma.followRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
    });

    // Update the original follow request notification to show it was accepted
    try {
      await this.prisma.notification.updateMany({
        where: {
          userId: followingId,
          actorId: followRequest.followerId,
          type: 'NEW_FOLLOW_REQUEST',
          payload: {
            path: ['followRequestId'],
            equals: requestId,
          },
        },
        data: {
          type: 'FOLLOW_REQUEST_ACCEPTED',
          payload: {
            title: 'Follow Request Accepted',
            message: 'accepted your follow request',
            followRequestId: requestId,
            status: 'ACCEPTED',
          },
        },
      });
    } catch (error) {
      console.error('Failed to update follow request notification:', error);
    }

    // Create connection
    const connection = await this.prisma.connection.create({
      data: {
        followerId: followRequest.followerId,
        followingId: followRequest.followingId,
      },
      include: {
        follower: {
          include: { profile: true },
        },
        following: {
          include: { profile: true },
        },
      },
    });

    // Delete the follow request since it's now converted to a connection
    await this.prisma.followRequest.delete({
      where: { id: requestId },
    });

    // Create notification for the follower
    try {
      await this.notificationsService.createNotification({
        userId: followRequest.followerId,
        actorId: followRequest.followingId,
        type: 'FOLLOW_REQUEST_ACCEPTED',
        payload: {
          title: 'Follow Request Accepted',
          message: 'accepted your follow request',
        },
      });
    } catch (error) {
      console.error(
        'Failed to create follow request accepted notification:',
        error,
      );
      // Don't fail the acceptance if notification fails
    }

    return connection;
  }

  // Reject follow request
  async rejectFollowRequest(requestId: number, followingId: number) {
    const followRequest = await this.prisma.followRequest.findFirst({
      where: {
        id: requestId,
        followingId,
        status: 'PENDING',
      },
    });

    if (!followRequest) {
      throw new NotFoundException(
        'Follow request not found or already processed',
      );
    }

    // Update follow request status
    const updatedRequest = await this.prisma.followRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
      include: {
        follower: {
          include: { profile: true },
        },
        following: {
          include: { profile: true },
        },
      },
    });

    // Update the original follow request notification to show it was rejected
    try {
      await this.prisma.notification.updateMany({
        where: {
          userId: followingId,
          actorId: followRequest.followerId,
          type: 'NEW_FOLLOW_REQUEST',
          payload: {
            path: ['followRequestId'],
            equals: requestId,
          },
        },
        data: {
          type: 'FOLLOW_REQUEST_REJECTED',
          payload: {
            title: 'Follow Request Rejected',
            message: 'rejected your follow request',
            followRequestId: requestId,
            status: 'REJECTED',
          },
        },
      });
    } catch (error) {
      console.error('Failed to update follow request notification:', error);
    }

    return updatedRequest;
  }

  // Unfollow user
  async unfollowUser(followerId: number, followingId: number) {
    const connection = await this.prisma.connection.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!connection) {
      throw new NotFoundException('Not following this user');
    }

    await this.prisma.connection.delete({
      where: { id: connection.id },
    });

    // Also update any pending follow request to rejected
    await this.prisma.followRequest.updateMany({
      where: {
        followerId,
        followingId,
        status: 'PENDING',
      },
      data: { status: 'REJECTED' },
    });

    return { message: 'Successfully unfollowed user' };
  }

  // Get follow requests received by user
  async getFollowRequests(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.prisma.followRequest.findMany({
        where: {
          followingId: userId,
          status: 'PENDING',
        },
        include: {
          follower: {
            include: { profile: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.followRequest.count({
        where: {
          followingId: userId,
          status: 'PENDING',
        },
      }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get follow requests sent by user
  async getSentFollowRequests(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.prisma.followRequest.findMany({
        where: {
          followerId: userId,
        },
        include: {
          following: {
            include: { profile: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.followRequest.count({
        where: {
          followerId: userId,
        },
      }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get followers of a user
  async getFollowers(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.connection.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            include: { profile: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.connection.count({
        where: { followingId: userId },
      }),
    ]);

    return {
      followers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get following of a user
  async getFollowing(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      this.prisma.connection.findMany({
        where: { followerId: userId },
        include: {
          following: {
            include: { profile: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.connection.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      following,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Check if user is following another user
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const connection = await this.prisma.connection.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!connection;
  }

  // Check if there's a pending follow request
  async hasPendingRequest(
    followerId: number,
    followingId: number,
  ): Promise<boolean> {
    const request = await this.prisma.followRequest.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return request?.status === 'PENDING';
  }

  // Get connection status between two users
  async getConnectionStatus(userId1: number, userId2: number) {
    if (userId1 === userId2) {
      return { status: 'SELF', isConnected: false, hasPendingRequest: false };
    }

    const [isFollowing, hasPendingRequest] = await Promise.all([
      this.isFollowing(userId1, userId2),
      this.hasPendingRequest(userId1, userId2),
    ]);

    if (isFollowing) {
      return {
        status: 'FOLLOWING',
        isConnected: true,
        hasPendingRequest: false,
      };
    }

    if (hasPendingRequest) {
      return { status: 'PENDING', isConnected: false, hasPendingRequest: true };
    }

    return {
      status: 'NOT_FOLLOWING',
      isConnected: false,
      hasPendingRequest: false,
    };
  }

  // Get user stats (followers, following counts)
  async getUserStats(userId: number) {
    const [followersCount, followingCount] = await Promise.all([
      this.prisma.connection.count({
        where: { followingId: userId },
      }),
      this.prisma.connection.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      followersCount,
      followingCount,
    };
  }

  // Find follow request by actor ID (for older notifications)
  async findFollowRequestByActor(followerId: number, followingId: number) {
    const followRequest = await this.prisma.followRequest.findFirst({
      where: {
        followerId,
        followingId,
        status: 'PENDING',
      },
      include: {
        follower: {
          include: {
            profile: {
              include: { avatar: true },
            },
          },
        },
      },
    });

    if (!followRequest) {
      return null;
    }

    return {
      id: followRequest.id,
      status: followRequest.status,
      createdAt: followRequest.createdAt,
      follower: {
        id: followRequest.follower.id,
        username: followRequest.follower.username,
        profile: followRequest.follower.profile
          ? {
              displayName: followRequest.follower.profile.displayName,
              avatar: followRequest.follower.profile.avatar
                ? { url: followRequest.follower.profile.avatar.url }
                : undefined,
            }
          : undefined,
      },
    };
  }
}
