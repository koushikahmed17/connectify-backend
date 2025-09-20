export interface CreateNotificationDto {
  userId: number;
  type:
    | 'NEW_LIKE'
    | 'NEW_COMMENT'
    | 'NEW_FRIEND_REQUEST'
    | 'FRIEND_REQUEST_ACCEPTED'
    | 'NEW_FOLLOW_REQUEST'
    | 'FOLLOW_REQUEST_ACCEPTED'
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
    followRequestId?: number;
    conversationId?: number;
    messageId?: number;
  };
  actorId?: number;
}

export class NotificationResponseDto {
  id: number;
  type: string;
  payload: any;
  isRead: boolean;
  createdAt: Date;
  actor?: {
    id: number;
    username: string;
    profile?: {
      displayName?: string;
      avatar?: {
        url: string;
      };
    };
  };
  user: {
    id: number;
    username: string;
    profile?: {
      displayName?: string;
      avatar?: {
        url: string;
      };
    };
  };
}

export class UnreadCountResponseDto {
  count: number;
}
