import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../user/auth/jwt-auth.guard';
import { CurrentUserId } from '../common/decorators/user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {
    console.log('🔔 NotificationsController initialized');
  }

  @Get('test')
  async test() {
    return { message: 'Notifications module is working!' };
  }

  @Get()
  async getUserNotifications(
    @CurrentUserId() userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.notificationsService.getUserNotifications(
      userId,
      pageNum,
      limitNum,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUserId() userId: number) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Put(':id/read')
  async markAsRead(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) notificationId: number,
  ) {
    return this.notificationsService.markAsRead(notificationId, userId);
  }

  @Put('mark-all-read')
  async markAllAsRead(@CurrentUserId() userId: number) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  async deleteNotification(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) notificationId: number,
  ) {
    return this.notificationsService.deleteNotification(notificationId, userId);
  }
}
