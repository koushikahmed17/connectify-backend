import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateConversationDto,
  SendMessageDto,
  GetConversationsDto,
  GetMessagesDto,
  MarkAsReadDto,
  ConversationResponseDto,
  MessageResponseDto,
  MessageType,
} from './dto/messaging.dto';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Create or get existing conversation between users
  async createOrGetConversation(
    userId: number,
    dto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    const { participantIds, title, isGroup = false } = dto;

    // Ensure the current user is included in participants
    const allParticipants = [...new Set([userId, ...participantIds])];

    if (allParticipants.length < 2) {
      throw new BadRequestException('At least 2 participants required');
    }

    // For direct messages (2 participants), check if conversation already exists
    if (!isGroup && allParticipants.length === 2) {
      const existingConversation = await this.prisma.conversation.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: {
              userId: {
                in: allParticipants,
              },
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                include: {
                  profile: {
                    include: { avatar: true },
                  },
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                include: {
                  profile: true,
                },
              },
            },
          },
        },
      });

      if (existingConversation) {
        return this.formatConversationResponse(existingConversation, userId);
      }
    }

    // Create new conversation
    const conversation = await this.prisma.conversation.create({
      data: {
        isGroup,
        title,
        participants: {
          create: allParticipants.map((participantId) => ({
            userId: participantId,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              include: {
                profile: {
                  include: { avatar: true },
                },
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    return this.formatConversationResponse(conversation, userId);
  }

  // Send a message
  async sendMessage(
    userId: number,
    dto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    const { conversationId, type, content, mediaIds, callData } = dto;

    console.log('Backend sendMessage - callData received:', callData);
    console.log('Backend sendMessage - type:', type);

    // Check if user is participant in conversation
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    // Create message
    console.log(
      'Backend - Creating message with callData:',
      callData ? JSON.stringify(callData) : 'undefined',
    );
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        type,
        content,
        callData: callData ? JSON.stringify(callData) : undefined,
        mediaUsages: mediaIds
          ? {
              create: mediaIds.map((mediaId, index) => ({
                mediaId,
                order: index,
              })),
            }
          : undefined,
      },
      include: {
        sender: {
          include: {
            profile: {
              include: { avatar: true },
            },
          },
        },
        mediaUsages: {
          include: {
            media: true,
          },
        },
      },
    });

    // Update conversation's lastMessageAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    // Create notifications for other participants
    const otherParticipants = conversation.participants
      .filter((p) => p.userId !== userId)
      .map((p) => p.userId);

    for (const participantId of otherParticipants) {
      try {
        await this.notificationsService.createNotification({
          userId: participantId,
          actorId: userId,
          type: 'NEW_MESSAGE',
          payload: {
            title: 'New Message',
            message:
              type === 'TEXT'
                ? content || 'Sent a message'
                : `Sent a ${type.toLowerCase()}`,
            conversationId,
            messageId: message.id,
          },
        });
      } catch (error) {
        console.error('Failed to create message notification:', error);
      }
    }

    return this.formatMessageResponse(message);
  }

  // Get user's conversations
  async getConversations(
    userId: number,
    dto: GetConversationsDto,
  ): Promise<{ conversations: ConversationResponseDto[]; total: number }> {
    const { page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          participants: {
            some: { userId },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                include: {
                  profile: {
                    include: { avatar: true },
                  },
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                include: {
                  profile: true,
                },
              },
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({
        where: {
          participants: {
            some: { userId },
          },
        },
      }),
    ]);

    const formattedConversations = conversations.map((conv) =>
      this.formatConversationResponse(conv, userId),
    );

    return {
      conversations: formattedConversations,
      total,
    };
  }

  // Get messages in a conversation
  async getMessages(
    userId: number,
    conversationId: number,
    dto: GetMessagesDto,
  ): Promise<{ messages: MessageResponseDto[]; total: number }> {
    const { page = 1, limit = 50 } = dto;
    const skip = (page - 1) * limit;

    // Check if user is participant
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { userId },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          conversationId,
          isDeleted: false,
        },
        include: {
          sender: {
            include: {
              profile: {
                include: { avatar: true },
              },
            },
          },
          mediaUsages: {
            include: {
              media: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({
        where: {
          conversationId,
          isDeleted: false,
        },
      }),
    ]);

    const formattedMessages = messages.map((msg) =>
      this.formatMessageResponse(msg),
    );

    return {
      messages: formattedMessages.reverse(), // Reverse to show oldest first
      total,
    };
  }

  // Mark messages as read
  async markAsRead(
    userId: number,
    dto: MarkAsReadDto,
  ): Promise<{ success: boolean }> {
    const { conversationId, messageId } = dto;

    // Check if user is participant
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { userId },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    // Update lastReadAt for the user
    await this.prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId,
      },
      data: {
        lastReadAt: messageId ? new Date() : new Date(), // If no specific message, mark all as read
      },
    });

    return { success: true };
  }

  // Get conversation by ID
  async getConversation(
    userId: number,
    conversationId: number,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              include: {
                profile: {
                  include: { avatar: true },
                },
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    return this.formatConversationResponse(conversation, userId);
  }

  // Helper method to format conversation response
  private formatConversationResponse(
    conversation: any,
    userId: number,
  ): ConversationResponseDto {
    const userParticipant = conversation.participants.find(
      (p: any) => p.userId === userId,
    );

    // Calculate unread count
    const unreadCount = userParticipant?.lastReadAt
      ? conversation.messages.filter(
          (msg: any) => msg.createdAt > userParticipant.lastReadAt,
        ).length
      : conversation.messages.length;

    return {
      id: conversation.id,
      isGroup: conversation.isGroup,
      title: conversation.title,
      createdAt: conversation.createdAt,
      lastMessageAt: conversation.lastMessageAt,
      participants: conversation.participants.map((p: any) => ({
        id: p.id,
        user: {
          id: p.user.id,
          username: p.user.username,
          profile: {
            displayName: p.user.profile?.displayName || p.user.username,
            avatar: p.user.profile?.avatar,
          },
        },
        joinedAt: p.joinedAt,
        lastReadAt: p.lastReadAt,
        isMuted: p.isMuted,
      })),
      lastMessage: conversation.messages[0]
        ? {
            id: conversation.messages[0].id,
            content: conversation.messages[0].content,
            type: conversation.messages[0].type,
            createdAt: conversation.messages[0].createdAt,
            sender: {
              id: conversation.messages[0].sender.id,
              username: conversation.messages[0].sender.username,
              profile: {
                displayName:
                  conversation.messages[0].sender.profile?.displayName ||
                  conversation.messages[0].sender.username,
              },
            },
          }
        : undefined,
      unreadCount,
    };
  }

  // Helper method to format message response
  private formatMessageResponse(message: any): MessageResponseDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      type: message.type,
      content: message.content,
      callData: message.callData ? JSON.parse(message.callData) : undefined,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      isEdited: message.isEdited,
      isDeleted: message.isDeleted,
      status: message.status,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        profile: {
          displayName:
            message.sender.profile?.displayName || message.sender.username,
          avatar: message.sender.profile?.avatar,
        },
      },
      mediaUsages: message.mediaUsages?.map((mu: any) => ({
        id: mu.id,
        media: {
          id: mu.media.id,
          url: mu.media.url,
          type: mu.media.type,
          filename: mu.media.filename,
        },
      })),
    };
  }
}
