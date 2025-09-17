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
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserId } from '../../common/decorators/user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createPost(
    @CurrentUserId() userId: number,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.createPost(userId, createPostDto);
  }

  @Get()
  async getAllPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.postsService.getAllPosts(pageNum, limitNum);
  }

  @Get('user/:userId')
  async getUserPosts(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.postsService.getUserPosts(userId, pageNum, limitNum);
  }

  @Get('my-posts')
  @UseGuards(JwtAuthGuard)
  async getMyPosts(
    @CurrentUserId() userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.postsService.getUserPosts(userId, pageNum, limitNum);
  }

  @Get(':id')
  async getPostById(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updatePost(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(userId, id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.postsService.deletePost(userId, id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.postsService.toggleLike(postId, userId);
  }

  @Post(':id/comment')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) postId: number,
    @Body('content') content: string,
  ) {
    return this.postsService.addComment(postId, userId, content);
  }

  @Get(':id/comments')
  async getComments(
    @Param('id', ParseIntPipe) postId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.postsService.getComments(postId, pageNum, limitNum);
  }
}
