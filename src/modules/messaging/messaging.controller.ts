import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUserId } from '../../shared/decorators/current-user-id.decorator';
import { ApiResponseDto } from '../../shared/dto/api-response.dto';
import {
  CreateConversationDto,
  SendMessageDto,
  GetConversationsDto,
  GetMessagesDto,
  MarkAsReadDto,
} from './dto/messaging.dto';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('conversations')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createConversation(
    @CurrentUserId() userId: number,
    @Body() dto: CreateConversationDto,
  ): Promise<ApiResponseDto> {
    const conversation = await this.messagingService.createOrGetConversation(
      userId,
      dto,
    );
    return ApiResponseDto.success(
      'Conversation created successfully',
      conversation,
    );
  }

  @Get('conversations')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async getConversations(
    @CurrentUserId() userId: number,
    @Query() dto: GetConversationsDto,
  ): Promise<ApiResponseDto> {
    const result = await this.messagingService.getConversations(userId, dto);
    return ApiResponseDto.success(
      'Conversations retrieved successfully',
      result,
    );
  }

  @Get('conversations/:id')
  async getConversation(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) conversationId: number,
  ): Promise<ApiResponseDto> {
    const conversation = await this.messagingService.getConversation(
      userId,
      conversationId,
    );
    return ApiResponseDto.success(
      'Conversation retrieved successfully',
      conversation,
    );
  }

  @Get('conversations/:id/messages')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async getMessages(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) conversationId: number,
    @Query() dto: GetMessagesDto,
  ): Promise<ApiResponseDto> {
    const result = await this.messagingService.getMessages(
      userId,
      conversationId,
      dto,
    );
    return ApiResponseDto.success('Messages retrieved successfully', result);
  }

  @Post('messages')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async sendMessage(
    @CurrentUserId() userId: number,
    @Body() dto: SendMessageDto,
  ): Promise<ApiResponseDto> {
    const message = await this.messagingService.sendMessage(userId, dto);
    return ApiResponseDto.success('Message sent successfully', message);
  }

  @Post('mark-read')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async markAsRead(
    @CurrentUserId() userId: number,
    @Body() dto: MarkAsReadDto,
  ): Promise<ApiResponseDto> {
    const result = await this.messagingService.markAsRead(userId, dto);
    return ApiResponseDto.success('Messages marked as read', result);
  }

  // Get or create conversation with a specific user
  @Post('conversations/with-user/:userId')
  async getOrCreateConversationWithUser(
    @CurrentUserId() currentUserId: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
  ): Promise<ApiResponseDto> {
    const conversation = await this.messagingService.createOrGetConversation(
      currentUserId,
      {
        participantIds: [targetUserId],
        isGroup: false,
      },
    );
    return ApiResponseDto.success(
      'Conversation retrieved successfully',
      conversation,
    );
  }
}










