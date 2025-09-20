import {
  IsString,
  IsOptional,
  MaxLength,
  IsArray,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MaxLength(2000, { message: 'Content must not exceed 2000 characters' })
  content: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  mediaIds?: number[];
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Content must not exceed 2000 characters' })
  content?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  mediaIds?: number[];

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

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
  medias: Array<{
    id: number;
    order: number;
    altText?: string;
    media: {
      id: number;
      url: string;
      mimeType: string;
    };
  }>;
  reactions: Array<{
    id: number;
    type: string;
    userId: number;
    user: {
      id: number;
      username: string;
    };
  }>;
  comments: Array<{
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
  }>;
  _count: {
    reactions: number;
    comments: number;
  };
}

export class CommentDto {
  @IsString()
  @MaxLength(1000, { message: 'Comment must not exceed 1000 characters' })
  content: string;
}

export class LikeResponseDto {
  liked: boolean;
  likeCount: number;
}






