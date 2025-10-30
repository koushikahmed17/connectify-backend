import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtConfigService } from '../../shared/config/jwt-config.service';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/messaging.dto';

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

@Injectable()
@WebSocketGateway({
  namespace: '/messaging',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<number, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly jwtConfigService: JwtConfigService,
    private readonly messagingService: MessagingService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth or query
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token, {
        secret: this.jwtConfigService.secret,
      });

      if (payload && payload.sub) {
        client.userId = payload.sub;
        this.connectedUsers.set(payload.sub, client.id);

        console.log(
          `User ${payload.sub} connected to messaging with socket ${client.id}`,
        );

        // Join user to their personal room
        client.join(`user_${payload.sub}`);
      } else {
        client.disconnect();
      }
    } catch (error) {
      console.error('Messaging WebSocket authentication error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      console.log(`User ${client.userId} disconnected from messaging`);
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: number },
  ) {
    if (!client.userId) return;

    try {
      // Verify user has access to conversation
      const conversation = await this.messagingService.getConversation(
        client.userId,
        data.conversationId,
      );

      if (conversation) {
        client.join(`conversation_${data.conversationId}`);
        client.emit('joined_conversation', {
          conversationId: data.conversationId,
        });
      }
    } catch (error) {
      client.emit('error', { message: 'Failed to join conversation' });
    }
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: number },
  ) {
    client.leave(`conversation_${data.conversationId}`);
    client.emit('left_conversation', { conversationId: data.conversationId });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendMessageDto,
  ) {
    if (!client.userId) return;

    try {
      const message = await this.messagingService.sendMessage(
        client.userId,
        data,
      );

      // Broadcast message to all participants in the conversation
      this.server
        .to(`conversation_${data.conversationId}`)
        .emit('new_message', message);

      // Send notification to participants who are not in the conversation room
      const conversation = await this.messagingService.getConversation(
        client.userId,
        data.conversationId,
      );

      for (const participant of conversation.participants) {
        if (participant.user.id !== client.userId) {
          const participantSocketId = this.connectedUsers.get(
            participant.user.id,
          );
          if (participantSocketId) {
            this.server.to(participantSocketId).emit('message_notification', {
              conversationId: data.conversationId,
              message,
              unreadCount: conversation.unreadCount,
            });
          }
        }
      }

      client.emit('message_sent', { messageId: message.id });
    } catch (error) {
      console.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: number },
  ) {
    if (!client.userId) return;

    client.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: client.userId,
      conversationId: data.conversationId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: number },
  ) {
    if (!client.userId) return;

    client.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: client.userId,
      conversationId: data.conversationId,
      isTyping: false,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: number; messageId?: number },
  ) {
    if (!client.userId) return;

    try {
      await this.messagingService.markAsRead(client.userId, {
        conversationId: data.conversationId,
        messageId: data.messageId,
      });

      // Notify other participants that messages were read
      client.to(`conversation_${data.conversationId}`).emit('messages_read', {
        userId: client.userId,
        conversationId: data.conversationId,
        messageId: data.messageId,
      });
    } catch (error) {
      client.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  // Method to send message notification to a specific user
  sendMessageNotification(userId: number, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('message_notification', notification);
    }
  }

  // Method to send typing indicator to conversation participants
  sendTypingIndicator(
    conversationId: number,
    userId: number,
    isTyping: boolean,
  ) {
    this.server.to(`conversation_${conversationId}`).emit('user_typing', {
      userId,
      conversationId,
      isTyping,
    });
  }
}










