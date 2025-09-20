import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFollowRequestDto {
  @IsInt()
  @Type(() => Number)
  followingId: number;
}

export class UpdateFollowRequestDto {
  @IsString()
  status: 'ACCEPTED' | 'REJECTED';
}

export class FollowRequestQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;
}

export class FollowResponseDto {
  id: number;
  followerId: number;
  followingId: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  follower?: {
    id: number;
    username: string;
    email: string;
    profile?: {
      id: number;
      displayName?: string;
      avatar?: {
        url: string;
      };
    };
  };
  following?: {
    id: number;
    username: string;
    email: string;
    profile?: {
      id: number;
      displayName?: string;
      avatar?: {
        url: string;
      };
    };
  };
}

export class ConnectionResponseDto {
  id: number;
  followerId: number;
  followingId: number;
  createdAt: Date;
  follower?: {
    id: number;
    username: string;
    email: string;
    profile?: {
      id: number;
      displayName?: string;
      avatar?: {
        url: string;
      };
    };
  };
  following?: {
    id: number;
    username: string;
    email: string;
    profile?: {
      id: number;
      displayName?: string;
      avatar?: {
        url: string;
      };
    };
  };
}

export class ConnectionStatusDto {
  status: 'SELF' | 'FOLLOWING' | 'PENDING' | 'NOT_FOLLOWING';
  isConnected: boolean;
  hasPendingRequest: boolean;
}

export class UserStatsDto {
  followersCount: number;
  followingCount: number;
}
