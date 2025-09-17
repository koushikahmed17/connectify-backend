import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createPost(
    userId: number,
    createPostDto: CreatePostDto,
  ): Promise<PostResponseDto> {
    const { content, mediaIds } = createPostDto;

    // Validate media IDs if provided
    if (mediaIds && mediaIds.length > 0) {
      const mediaCount = await this.prisma.media.count({
        where: {
          id: { in: mediaIds },
          uploadedById: userId, // Ensure user owns the media
        },
      });

      if (mediaCount !== mediaIds.length) {
        throw new BadRequestException(
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
      include: {
        author: {
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        },
        medias: {
          include: {
            media: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        reactions: {
          include: {
            user: true,
          },
        },
        comments: {
          include: {
            author: {
              include: {
                profile: {
                  include: {
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5, // Limit comments for performance
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });

    return this.formatPostResponse(post);
  }

  async getAllPosts(
    page: number = 1,
    limit: number = 10,
  ): Promise<PostResponseDto[]> {
    const skip = (page - 1) * limit;

    const posts = await this.prisma.post.findMany({
      where: {
        isDraft: false,
        deletedAt: null,
      },
      include: {
        author: {
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        },
        medias: {
          include: {
            media: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        reactions: {
          include: {
            user: true,
          },
        },
        comments: {
          include: {
            author: {
              include: {
                profile: {
                  include: {
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return posts.map((post) => this.formatPostResponse(post));
  }

  async getPostById(postId: number): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
        deletedAt: null,
      },
      include: {
        author: {
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        },
        medias: {
          include: {
            media: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        reactions: {
          include: {
            user: true,
          },
        },
        comments: {
          include: {
            author: {
              include: {
                profile: {
                  include: {
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
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
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    if (post.deletedAt) {
      throw new NotFoundException('Post not found');
    }

    const { content, mediaIds } = updatePostDto;

    // Validate media IDs if provided
    if (mediaIds && mediaIds.length > 0) {
      const mediaCount = await this.prisma.media.count({
        where: {
          id: { in: mediaIds },
          uploadedById: userId,
        },
      });

      if (mediaCount !== mediaIds.length) {
        throw new BadRequestException(
          'Some media files not found or not owned by user',
        );
      }
    }

    // Update post
    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: {
        content,
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
      include: {
        author: {
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        },
        medias: {
          include: {
            media: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        reactions: {
          include: {
            user: true,
          },
        },
        comments: {
          include: {
            author: {
              include: {
                profile: {
                  include: {
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
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
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    if (post.deletedAt) {
      throw new NotFoundException('Post not found');
    }

    // Soft delete
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Post deleted successfully' };
  }

  async getUserPosts(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<PostResponseDto[]> {
    const skip = (page - 1) * limit;

    const posts = await this.prisma.post.findMany({
      where: {
        authorId: userId,
        isDraft: false,
        deletedAt: null,
      },
      include: {
        author: {
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        },
        medias: {
          include: {
            media: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        reactions: {
          include: {
            user: true,
          },
        },
        comments: {
          include: {
            author: {
              include: {
                profile: {
                  include: {
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return posts.map((post) => this.formatPostResponse(post));
  }

  async toggleLike(
    postId: number,
    userId: number,
  ): Promise<{ liked: boolean; likeCount: number }> {
    // Get post details first
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user already liked this post
    const existingLike = await this.prisma.reaction.findFirst({
      where: {
        postId,
        userId,
        type: 'LIKE',
      },
    });

    if (existingLike) {
      // Unlike the post
      await this.prisma.reaction.delete({
        where: { id: existingLike.id },
      });
    } else {
      // Like the post
      await this.prisma.reaction.create({
        data: {
          postId,
          userId,
          type: 'LIKE',
        },
      });

      // Create notification for post author (if not the same user)
      if (post.authorId !== userId) {
        await this.notificationsService.createNotification({
          userId: post.authorId,
          type: 'NEW_LIKE',
          payload: {
            title: 'New Like',
            message: `Someone liked your post`,
            relatedUserId: userId,
            relatedPostId: postId,
          },
          actorId: userId,
        });
      }
    }

    // Get updated like count
    const likeCount = await this.prisma.reaction.count({
      where: {
        postId,
        type: 'LIKE',
      },
    });

    // Check if user currently likes the post
    const currentLike = await this.prisma.reaction.findFirst({
      where: {
        postId,
        userId,
        type: 'LIKE',
      },
    });

    return {
      liked: !!currentLike,
      likeCount,
    };
  }

  async addComment(
    postId: number,
    userId: number,
    content: string,
  ): Promise<any> {
    // Get post details first
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content,
      },
      include: {
        author: {
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Create notification for post author (if not the same user)
    if (post.authorId !== userId) {
      await this.notificationsService.createNotification({
        userId: post.authorId,
        type: 'NEW_COMMENT',
        payload: {
          title: 'New Comment',
          message: `Someone commented on your post`,
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
    page: number = 1,
    limit: number = 10,
  ): Promise<any[]> {
    const skip = (page - 1) * limit;

    const comments = await this.prisma.comment.findMany({
      where: { postId },
      include: {
        author: {
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return comments;
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
                ? {
                    url: post.author.profile.avatar.url,
                  }
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
                  ? {
                      url: comment.author.profile.avatar.url,
                    }
                  : undefined,
              }
            : undefined,
        },
      })),
      _count: post._count,
    };
  }
}
