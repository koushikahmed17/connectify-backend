import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import {
  CreateNotificationDto,
  NotificationResponseDto,
} from './dto/notifications.dto';
import {
  PaginationDto,
  PaginationResponseDto,
} from '../../shared/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async createNotification(
    data: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.create({
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
              include: { avatar: true },
            },
          },
        },
        user: {
          include: {
            profile: {
              include: { avatar: true },
            },
          },
        },
      },
    });

    const formattedNotification = this.formatNotificationResponse(notification);

    // Send real-time notification via WebSocket
    try {
      this.notificationsGateway.sendNotificationToUser(
        data.userId,
        formattedNotification,
      );
    } catch (error) {
      console.error('Failed to send real-time notification:', error);
    }

    return formattedNotification;
  }

  // Create follow request notification
  async createFollowRequestNotification(
    followerId: number,
    followingId: number,
  ): Promise<NotificationResponseDto> {
    return this.createNotification({
      userId: followingId,
      actorId: followerId,
      type: 'NEW_FOLLOW_REQUEST',
      payload: {
        title: 'New Follow Request',
        message: 'sent you a follow request',
        // followRequestId will be updated after follow request is created
      },
    });
  }

  // Create follow request accepted notification
  async createFollowRequestAcceptedNotification(
    followerId: number,
    followingId: number,
  ): Promise<NotificationResponseDto> {
    return this.createNotification({
      userId: followerId,
      actorId: followingId,
      type: 'FOLLOW_REQUEST_ACCEPTED',
      payload: {
        title: 'Follow Request Accepted',
        message: 'accepted your follow request',
      },
    });
  }

  async getUserNotifications(
    userId: number,
    pagination: PaginationDto,
  ): Promise<PaginationResponseDto<NotificationResponseDto>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        include: {
          actor: {
            include: {
              profile: {
                include: { avatar: true },
              },
            },
          },
          user: {
            include: {
              profile: {
                include: { avatar: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: { userId },
      }),
    ]);

    const formattedNotifications = notifications.map((notification) =>
      this.formatNotificationResponse(notification),
    );

    return new PaginationResponseDto(
      formattedNotifications,
      page,
      limit,
      total,
    );
  }

  async markAsRead(
    notificationId: number,
    userId: number,
  ): Promise<{ message: string }> {
    await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId,
      },
      data: {
        isRead: true,
      },
    });

    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: number): Promise<{ message: string }> {
    await this.prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId: userId,
        isRead: false,
      },
    });
  }

  async deleteNotification(
    notificationId: number,
    userId: number,
  ): Promise<{ message: string }> {
    await this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: userId,
      },
    });

    return { message: 'Notification deleted successfully' };
  }

  private formatNotificationResponse(
    notification: any,
  ): NotificationResponseDto {
    return {
      id: notification.id,
      type: notification.type,
      payload: notification.payload,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      actor: notification.actor
        ? {
            id: notification.actor.id,
            username: notification.actor.username,
            profile: notification.actor.profile
              ? {
                  displayName: notification.actor.profile.displayName,
                  avatar: notification.actor.profile.avatar
                    ? { url: notification.actor.profile.avatar.url }
                    : undefined,
                }
              : undefined,
          }
        : undefined,
      user: {
        id: notification.user.id,
        username: notification.user.username,
        profile: notification.user.profile
          ? {
              displayName: notification.user.profile.displayName,
              avatar: notification.user.profile.avatar
                ? { url: notification.user.profile.avatar.url }
                : undefined,
            }
          : undefined,
      },
    };
  }
}
