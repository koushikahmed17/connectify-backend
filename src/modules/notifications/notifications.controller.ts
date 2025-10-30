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
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUserId } from '../../shared/decorators/current-user-id.decorator';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { ApiResponseDto } from '../../shared/dto/api-response.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(
    @CurrentUserId() userId: number,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponseDto> {
    const result = await this.notificationsService.getUserNotifications(
      userId,
      pagination,
    );
    return ApiResponseDto.success(
      'Notifications retrieved successfully',
      result,
    );
  }

  @Get('unread-count')
  async getUnreadCount(
    @CurrentUserId() userId: number,
  ): Promise<ApiResponseDto> {
    const count = await this.notificationsService.getUnreadCount(userId);
    return ApiResponseDto.success('Unread count retrieved successfully', {
      count,
    });
  }

  @Put(':id/read')
  async markAsRead(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) notificationId: number,
  ): Promise<ApiResponseDto> {
    const result = await this.notificationsService.markAsRead(
      notificationId,
      userId,
    );
    return ApiResponseDto.success(result.message);
  }

  @Put('mark-all-read')
  async markAllAsRead(
    @CurrentUserId() userId: number,
  ): Promise<ApiResponseDto> {
    const result = await this.notificationsService.markAllAsRead(userId);
    return ApiResponseDto.success(result.message);
  }

  @Delete(':id')
  async deleteNotification(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) notificationId: number,
  ): Promise<ApiResponseDto> {
    const result = await this.notificationsService.deleteNotification(
      notificationId,
      userId,
    );
    return ApiResponseDto.success(result.message);
  }
}












