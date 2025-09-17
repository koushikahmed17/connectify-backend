import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateNotificationDto {
  userId: number;
  type:
    | 'NEW_LIKE'
    | 'NEW_COMMENT'
    | 'NEW_FRIEND_REQUEST'
    | 'FRIEND_REQUEST_ACCEPTED'
    | 'NEW_MESSAGE'
    | 'MENTION'
    | 'FOLLOW'
    | 'SYSTEM';
  payload: {
    title: string;
    message: string;
    relatedUserId?: number;
    relatedPostId?: number;
    relatedCommentId?: number;
  };
  actorId?: number;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(data: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        payload: data.payload,
        actorId: data.actorId,
      },
      include: {
        actor: {
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        },
        user: {
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async getUserNotifications(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      include: {
        actor: {
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        },
        user: {
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return notifications;
  }

  async markAsRead(notificationId: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId,
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: {
        userId: userId,
        isRead: false,
      },
    });
  }

  async deleteNotification(notificationId: number, userId: number) {
    return this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: userId,
      },
    });
  }
}
