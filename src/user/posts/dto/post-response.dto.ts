export class PostResponseDto {
  id: number;
  content: string;
  isDraft: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  author: {
    id: number;
    username: string;
    email: string;
    profile?: {
      displayName?: string;
      avatar?: {
        url: string;
      };
    };
  };
  medias: {
    id: number;
    order: number;
    altText?: string;
    media: {
      id: number;
      url: string;
      mimeType: string;
    };
  }[];
  reactions: {
    id: number;
    type: string;
    userId: number;
    user: {
      id: number;
      username: string;
    };
  }[];
  comments: {
    id: number;
    content: string;
    createdAt: Date;
    author: {
      id: number;
      username: string;
      profile?: {
        displayName?: string;
        avatar?: {
          url: string;
        };
      };
    };
  }[];
  _count: {
    reactions: number;
    comments: number;
  };
}
