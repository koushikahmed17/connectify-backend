import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreatePostDto,
  UpdatePostDto,
  PostResponseDto,
  CommentDto,
  LikeResponseDto,
} from './dto/posts.dto';
import {
  PostNotFoundException,
  UnauthorizedAccessException,
  ValidationException,
} from '../../shared/exceptions/business.exceptions';
import {
  PaginationDto,
  PaginationResponseDto,
} from '../../shared/dto/pagination.dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createPost(
    userId: number,
    createPostDto: CreatePostDto,
  ): Promise<PostResponseDto> {
    const { content, mediaIds } = createPostDto;

    if (mediaIds && mediaIds.length > 0) {
      const mediaCount = await this.prisma.media.count({
        where: {
          id: { in: mediaIds },
          uploadedById: userId,
        },
      });

      if (mediaCount !== mediaIds.length) {
        throw new ValidationException(
          'Some media files not found or not owned by user',
        );
      }
    }

    const post = await this.prisma.post.create({
      data: {
        content,
        authorId: userId,
        medias:
          mediaIds && mediaIds.length > 0
            ? {
                create: mediaIds.map((mediaId, index) => ({
                  mediaId,
                  order: index,
                })),
              }
            : undefined,
      },
      include: this.getPostInclude(),
    });

    return this.formatPostResponse(post);
  }

  async getAllPosts(
    pagination: PaginationDto,
  ): Promise<PaginationResponseDto<PostResponseDto>> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          isDraft: false,
          deletedAt: null,
        },
        include: this.getPostInclude(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.post.count({
        where: {
          isDraft: false,
          deletedAt: null,
        },
      }),
    ]);

    const formattedPosts = posts.map((post) => this.formatPostResponse(post));
    return new PaginationResponseDto(formattedPosts, page, limit, total);
  }

  async getPostById(postId: number): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
        deletedAt: null,
      },
      include: this.getPostInclude(),
    });

    if (!post) {
      throw new PostNotFoundException();
    }

    return this.formatPostResponse(post);
  }

  async updatePost(
    userId: number,
    postId: number,
    updatePostDto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new PostNotFoundException();
    }

    if (post.authorId !== userId) {
      throw new UnauthorizedAccessException(
        'You can only update your own posts',
      );
    }

    if (post.deletedAt) {
      throw new PostNotFoundException();
    }

    const { content, mediaIds, isDraft, isPinned } = updatePostDto;

    if (mediaIds && mediaIds.length > 0) {
      const mediaCount = await this.prisma.media.count({
        where: {
          id: { in: mediaIds },
          uploadedById: userId,
        },
      });

      if (mediaCount !== mediaIds.length) {
        throw new ValidationException(
          'Some media files not found or not owned by user',
        );
      }
    }

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: {
        content,
        isDraft,
        isPinned,
        medias: mediaIds
          ? {
              deleteMany: {},
              create: mediaIds.map((mediaId, index) => ({
                mediaId,
                order: index,
              })),
            }
          : undefined,
      },
      include: this.getPostInclude(),
    });

    return this.formatPostResponse(updatedPost);
  }

  async deletePost(
    userId: number,
    postId: number,
  ): Promise<{ message: string }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new PostNotFoundException();
    }

    if (post.authorId !== userId) {
      throw new UnauthorizedAccessException(
        'You can only delete your own posts',
      );
    }

    if (post.deletedAt) {
      throw new PostNotFoundException();
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Post deleted successfully' };
  }

  async getUserPosts(
    userId: number,
    pagination: PaginationDto,
  ): Promise<PaginationResponseDto<PostResponseDto>> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          authorId: userId,
          isDraft: false,
          deletedAt: null,
        },
        include: this.getPostInclude(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.post.count({
        where: {
          authorId: userId,
          isDraft: false,
          deletedAt: null,
        },
      }),
    ]);

    const formattedPosts = posts.map((post) => this.formatPostResponse(post));
    return new PaginationResponseDto(formattedPosts, page, limit, total);
  }

  async toggleLike(postId: number, userId: number): Promise<LikeResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          include: { profile: true },
        },
      },
    });

    if (!post) {
      throw new PostNotFoundException();
    }

    const existingLike = await this.prisma.reaction.findFirst({
      where: {
        postId,
        userId,
        type: 'LIKE',
      },
    });

    if (existingLike) {
      await this.prisma.reaction.delete({
        where: { id: existingLike.id },
      });
    } else {
      await this.prisma.reaction.create({
        data: {
          postId,
          userId,
          type: 'LIKE',
        },
      });

      if (post.authorId !== userId) {
        await this.notificationsService.createNotification({
          userId: post.authorId,
          type: 'NEW_LIKE',
          payload: {
            title: 'New Like',
            message: 'Someone liked your post',
            relatedUserId: userId,
            relatedPostId: postId,
          },
          actorId: userId,
        });
      }
    }

    const likeCount = await this.prisma.reaction.count({
      where: { postId, type: 'LIKE' },
    });

    const currentLike = await this.prisma.reaction.findFirst({
      where: { postId, userId, type: 'LIKE' },
    });

    return {
      liked: !!currentLike,
      likeCount,
    };
  }

  async addComment(
    postId: number,
    userId: number,
    commentDto: CommentDto,
  ): Promise<any> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          include: { profile: true },
        },
      },
    });

    if (!post) {
      throw new PostNotFoundException();
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content: commentDto.content,
      },
      include: {
        author: {
          include: {
            profile: {
              include: { avatar: true },
            },
          },
        },
      },
    });

    if (post.authorId !== userId) {
      await this.notificationsService.createNotification({
        userId: post.authorId,
        type: 'NEW_COMMENT',
        payload: {
          title: 'New Comment',
          message: 'Someone commented on your post',
          relatedUserId: userId,
          relatedPostId: postId,
          relatedCommentId: comment.id,
        },
        actorId: userId,
      });
    }

    return comment;
  }

  async getComments(
    postId: number,
    pagination: PaginationDto,
  ): Promise<PaginationResponseDto<any>> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          postId,
          deletedAt: null,
          parentId: null, // Only get top-level comments
        },
        include: {
          author: {
            include: {
              profile: {
                include: { avatar: true },
              },
            },
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          replies: {
            where: { deletedAt: null },
            include: {
              author: {
                include: {
                  profile: {
                    include: { avatar: true },
                  },
                },
              },
              reactions: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
            take: 50, // Show more replies for better user experience
          },
          _count: {
            select: {
              replies: {
                where: { deletedAt: null },
              },
              reactions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({
        where: {
          postId,
          deletedAt: null,
          parentId: null,
        },
      }),
    ]);

    return new PaginationResponseDto(comments, page, limit, total);
  }

  async addCommentReply(
    commentId: number,
    userId: number,
    replyDto: CommentDto,
  ): Promise<any> {
    const parentComment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          include: {
            author: {
              include: { profile: true },
            },
          },
        },
        author: {
          include: { profile: true },
        },
      },
    });

    if (!parentComment) {
      throw new PostNotFoundException();
    }

    const reply = await this.prisma.comment.create({
      data: {
        postId: parentComment.postId,
        authorId: userId,
        parentId: commentId,
        content: replyDto.content,
      },
      include: {
        author: {
          include: {
            profile: {
              include: { avatar: true },
            },
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: {
              where: { deletedAt: null },
            },
            reactions: true,
          },
        },
      },
    });

    // Notify the parent comment author
    if (parentComment.authorId !== userId) {
      await this.notificationsService.createNotification({
        userId: parentComment.authorId,
        type: 'NEW_COMMENT',
        payload: {
          title: 'New Reply',
          message: 'Someone replied to your comment',
          relatedUserId: userId,
          relatedPostId: parentComment.postId,
          relatedCommentId: reply.id,
        },
        actorId: userId,
      });
    }

    return reply;
  }

  async toggleCommentLike(commentId: number, userId: number): Promise<any> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          include: { profile: true },
        },
      },
    });

    if (!comment) {
      throw new PostNotFoundException();
    }

    const existingLike = await this.prisma.commentReaction.findFirst({
      where: {
        commentId,
        userId,
        type: 'LIKE',
      },
    });

    if (existingLike) {
      await this.prisma.commentReaction.delete({
        where: { id: existingLike.id },
      });
    } else {
      await this.prisma.commentReaction.create({
        data: {
          commentId,
          userId,
          type: 'LIKE',
        },
      });

      // Notify comment author
      if (comment.authorId !== userId) {
        await this.notificationsService.createNotification({
          userId: comment.authorId,
          type: 'NEW_LIKE',
          payload: {
            title: 'New Like',
            message: 'Someone liked your comment',
            relatedUserId: userId,
            relatedPostId: comment.postId,
            relatedCommentId: commentId,
          },
          actorId: userId,
        });
      }
    }

    const likeCount = await this.prisma.commentReaction.count({
      where: { commentId, type: 'LIKE' },
    });

    const currentLike = await this.prisma.commentReaction.findFirst({
      where: { commentId, userId, type: 'LIKE' },
    });

    return {
      liked: !!currentLike,
      likeCount,
    };
  }

  async getCommentReplies(
    commentId: number,
    pagination: PaginationDto,
  ): Promise<PaginationResponseDto<any>> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          parentId: commentId,
          deletedAt: null,
        },
        include: {
          author: {
            include: {
              profile: {
                include: { avatar: true },
              },
            },
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: {
                where: { deletedAt: null },
              },
              reactions: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({
        where: {
          parentId: commentId,
          deletedAt: null,
        },
      }),
    ]);

    return new PaginationResponseDto(replies, page, limit, total);
  }

  private getPostInclude() {
    return {
      author: {
        include: {
          profile: {
            include: { avatar: true },
          },
        },
      },
      medias: {
        include: { media: true },
        orderBy: { order: 'asc' as const },
      },
      reactions: {
        include: { user: true },
      },
      comments: {
        include: {
          author: {
            include: {
              profile: {
                include: { avatar: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' as const },
        take: 5,
      },
      _count: {
        select: {
          reactions: true,
          comments: true,
        },
      },
    };
  }

  private formatPostResponse(post: any): PostResponseDto {
    return {
      id: post.id,
      content: post.content,
      isDraft: post.isDraft,
      isPinned: post.isPinned,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      authorId: post.authorId,
      author: {
        id: post.author.id,
        username: post.author.username,
        email: post.author.email,
        profile: post.author.profile
          ? {
              displayName: post.author.profile.displayName,
              avatar: post.author.profile.avatar
                ? { url: post.author.profile.avatar.url }
                : undefined,
            }
          : undefined,
      },
      medias: post.medias.map((pm: any) => ({
        id: pm.id,
        order: pm.order,
        altText: pm.altText,
        media: {
          id: pm.media.id,
          url: pm.media.url,
          mimeType: pm.media.mimeType,
        },
      })),
      reactions: post.reactions.map((reaction: any) => ({
        id: reaction.id,
        type: reaction.type,
        userId: reaction.userId,
        user: {
          id: reaction.user.id,
          username: reaction.user.username,
        },
      })),
      comments: post.comments.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: {
          id: comment.author.id,
          username: comment.author.username,
          profile: comment.author.profile
            ? {
                displayName: comment.author.profile.displayName,
                avatar: comment.author.profile.avatar
                  ? { url: comment.author.profile.avatar.url }
                  : undefined,
              }
            : undefined,
        },
      })),
      _count: post._count,
    };
  }
}
