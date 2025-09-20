import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, CommentDto } from './dto/posts.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUserId } from '../../shared/decorators/current-user-id.decorator';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { ApiResponseDto } from '../../shared/dto/api-response.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createPost(
    @CurrentUserId() userId: number,
    @Body() createPostDto: CreatePostDto,
  ): Promise<ApiResponseDto> {
    const post = await this.postsService.createPost(userId, createPostDto);
    return ApiResponseDto.success('Post created successfully', post);
  }

  @Get()
  async getAllPosts(
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponseDto> {
    const result = await this.postsService.getAllPosts(pagination);
    return ApiResponseDto.success('Posts retrieved successfully', result);
  }

  @Get('user/:userId')
  async getUserPosts(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponseDto> {
    const result = await this.postsService.getUserPosts(userId, pagination);
    return ApiResponseDto.success('User posts retrieved successfully', result);
  }

  @Get('my-posts')
  @UseGuards(JwtAuthGuard)
  async getMyPosts(
    @CurrentUserId() userId: number,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponseDto> {
    const result = await this.postsService.getUserPosts(userId, pagination);
    return ApiResponseDto.success('My posts retrieved successfully', result);
  }

  @Get(':id')
  async getPostById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto> {
    const post = await this.postsService.getPostById(id);
    return ApiResponseDto.success('Post retrieved successfully', post);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updatePost(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<ApiResponseDto> {
    const post = await this.postsService.updatePost(userId, id, updatePostDto);
    return ApiResponseDto.success('Post updated successfully', post);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto> {
    const result = await this.postsService.deletePost(userId, id);
    return ApiResponseDto.success(result.message);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) postId: number,
  ): Promise<ApiResponseDto> {
    const result = await this.postsService.toggleLike(postId, userId);
    return ApiResponseDto.success('Like toggled successfully', result);
  }

  @Post(':id/comment')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async addComment(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) postId: number,
    @Body() commentDto: CommentDto,
  ): Promise<ApiResponseDto> {
    const comment = await this.postsService.addComment(
      postId,
      userId,
      commentDto,
    );
    return ApiResponseDto.success('Comment added successfully', comment);
  }

  @Get(':id/comments')
  async getComments(
    @Param('id', ParseIntPipe) postId: number,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponseDto> {
    const result = await this.postsService.getComments(postId, pagination);
    return ApiResponseDto.success('Comments retrieved successfully', result);
  }

  @Post('comments/:commentId/reply')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async addCommentReply(
    @CurrentUserId() userId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() replyDto: CommentDto,
  ): Promise<ApiResponseDto> {
    const result = await this.postsService.addCommentReply(
      commentId,
      userId,
      replyDto,
    );
    return ApiResponseDto.success('Reply added successfully', result);
  }

  @Post('comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  async toggleCommentLike(
    @CurrentUserId() userId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ): Promise<ApiResponseDto> {
    const result = await this.postsService.toggleCommentLike(commentId, userId);
    return ApiResponseDto.success('Comment like toggled successfully', result);
  }

  @Get('comments/:commentId/replies')
  async getCommentReplies(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponseDto> {
    const result = await this.postsService.getCommentReplies(
      commentId,
      pagination,
    );
    return ApiResponseDto.success(
      'Comment replies retrieved successfully',
      result,
    );
  }
}
