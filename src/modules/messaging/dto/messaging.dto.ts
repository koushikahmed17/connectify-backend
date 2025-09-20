import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  SYSTEM = 'SYSTEM',
  CALL_LOG = 'CALL_LOG',
}

export class CreateConversationDto {
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  participantIds: number[];

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  isGroup?: boolean = false;
}

export class SendMessageDto {
  @IsInt()
  @Type(() => Number)
  conversationId: number;

  @IsEnum(MessageType)
  type: MessageType;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  mediaIds?: number[];

  @IsOptional()
  callData?: any;
}

export class GetConversationsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

export class GetMessagesDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;
}

export class MarkAsReadDto {
  @IsInt()
  @Type(() => Number)
  conversationId: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  messageId?: number;
}

export class ConversationResponseDto {
  id: number;
  isGroup: boolean;
  title?: string;
  createdAt: Date;
  lastMessageAt?: Date;
  participants: {
    id: number;
    user: {
      id: number;
      username: string;
      profile: {
        displayName: string;
        avatar?: {
          url: string;
        };
      };
    };
    joinedAt: Date;
    lastReadAt?: Date;
    isMuted: boolean;
  }[];
  lastMessage?: {
    id: number;
    content?: string;
    type: MessageType;
    createdAt: Date;
    sender: {
      id: number;
      username: string;
      profile: {
        displayName: string;
      };
    };
  };
  unreadCount: number;
}

export class MessageResponseDto {
  id: number;
  conversationId: number;
  senderId: number;
  type: MessageType;
  content?: string;
  callData?: any;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  isDeleted: boolean;
  status?: string;
  sender: {
    id: number;
    username: string;
    profile: {
      displayName: string;
      avatar?: {
        url: string;
      };
    };
  };
  mediaUsages?: {
    id: number;
    media: {
      id: number;
      url: string;
      type: string;
      filename: string;
    };
  }[];
}
