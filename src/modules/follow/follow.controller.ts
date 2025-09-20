import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FollowService } from './follow.service';
import {
  CreateFollowRequestDto,
  FollowRequestQueryDto,
  UpdateFollowRequestDto,
} from './dto/follow.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ApiResponseDto } from '../../shared/dto/api-response.dto';

@Controller('follow')
@UseGuards(JwtAuthGuard)
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  // Send follow request
  @Post('request')
  async sendFollowRequest(
    @Body() createFollowRequestDto: CreateFollowRequestDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const followRequest = await this.followService.sendFollowRequest(
        user.id || user.sub,
        createFollowRequestDto.followingId,
      );

      return res.json(
        ApiResponseDto.success(
          'Follow request sent successfully',
          followRequest,
        ),
      );
    } catch (error) {
      return res
        .status(error.status || 400)
        .json(ApiResponseDto.error(error.message));
    }
  }

  // Accept follow request
  @Put('request/:requestId/accept')
  async acceptFollowRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const connection = await this.followService.acceptFollowRequest(
        requestId,
        user.id || user.sub,
      );

      return res.json(
        ApiResponseDto.success(
          'Follow request accepted successfully',
          connection,
        ),
      );
    } catch (error) {
      return res
        .status(error.status || 400)
        .json(ApiResponseDto.error(error.message));
    }
  }

  // Reject follow request
  @Put('request/:requestId/reject')
  async rejectFollowRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const followRequest = await this.followService.rejectFollowRequest(
        requestId,
        user.id || user.sub,
      );

      return res.json(
        ApiResponseDto.success(
          'Follow request rejected successfully',
          followRequest,
        ),
      );
    } catch (error) {
      return res
        .status(error.status || 400)
        .json(ApiResponseDto.error(error.message));
    }
  }

  // Unfollow user
  @Delete('unfollow/:followingId')
  async unfollowUser(
    @Param('followingId', ParseIntPipe) followingId: number,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const result = await this.followService.unfollowUser(
        user.id || user.sub,
        followingId,
      );

      return res.json(ApiResponseDto.success(result.message));
    } catch (error) {
      return res
        .status(error.status || 400)
        .json(ApiResponseDto.error(error.message));
    }
  }

  // Get follow requests received by current user
  @Get('requests/received')
  async getFollowRequests(
    @Query() query: FollowRequestQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const result = await this.followService.getFollowRequests(
        user.id || user.sub,
        query.page,
        query.limit,
      );

      return res.json(
        ApiResponseDto.success(
          'Follow requests retrieved successfully',
          result,
        ),
      );
    } catch (error) {
      return res
        .status(error.status || 400)
        .json(ApiResponseDto.error(error.message));
    }
  }

  // Get follow requests sent by current user
  @Get('requests/sent')
  async getSentFollowRequests(
    @Query() query: FollowRequestQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const result = await this.followService.getSentFollowRequests(
        user.id || user.sub,
        query.page,
        query.limit,
      );

      return res.json(
        ApiResponseDto.success(
          'Sent follow requests retrieved successfully',
          result,
        ),
      );
    } catch (error) {
      return res
        .status(error.status || 400)
        .json(ApiResponseDto.error(error.message));
    }
  }

  // Get followers of current user
  @Get('followers')
  async getFollowers(
    @Query() query: FollowRequestQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const result = await this.followService.getFollowers(
        user.id || user.sub,
        query.page,
        query.limit,
      );

      return res.json(
        ApiResponseDto.success('Followers retrieved successfully', result),
      );
    } catch (error) {
      return res
        .status(error.status || 400)
        .json(ApiResponseDto.error(error.message));
    }
  }

  // Get following of current user
  @Get('following')
  async getFollowing(
    @Query() query: FollowRequestQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const result = await this.followService.getFollowing(
        user.id || user.sub,
        query.page,
        query.limit,
      );

      return res.json(
        ApiResponseDto.success('Following retrieved successfully', result),
      );
    } catch (error) {
      return res
        .status(error.status || 400)
        .json(ApiResponseDto.error(error.message));
    }
  }

  // Get followers of a specific user
  @Get('followers/:userId')
  async getUserFollowers(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: FollowRequestQueryDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.followService.getFollowers(
        userId,
        query.page,
        query.limit,
      );

      return res.json(
        ApiResponseDto.success('User followers retrieved successfully', result),
      );
    } catch (error) {
      return res
        .status(error.status || 400)
        .json(ApiResponseDto.error(error.message));
    }
  }

  // Get following of a specific user
  @Get('following/:userId')
  async getUserFollowing(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: FollowRequestQueryDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.followService.getFollowing(
        userId,
        query.page,
        query.limit,
      );

      return res.json(
        ApiResponseDto.success('User following retrieved successfully', result),
      );
    } catch (error) {
      return res
        .status(error.status || 400)
        .json(ApiResponseDto.error(error.message));
    }
  }

  // Check connection status between current user and another user
  @Get('status/:userId')
  async getConnectionStatus(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const status = await this.followService.getConnectionStatus(
        user.id || user.sub,
        userId,
      );

      return res.json(
        ApiResponseDto.success(
          'Connection status retrieved successfully',
          status,
        ),
      );
    } catch (error) {
      return res
        .status(error.status || 400)
        .json(ApiResponseDto.error(error.message));
    }
  }

  // Get user stats (followers, following counts)
  @Get('stats/:userId')
  async getUserStats(
    @Param('userId', ParseIntPipe) userId: number,
    @Res() res: Response,
  ) {
    try {
      const stats = await this.followService.getUserStats(userId);

      return res.json(
        ApiResponseDto.success('User stats retrieved successfully', stats),
      );
    } catch (error) {
      return res
        .status(error.status || 400)
        .json(ApiResponseDto.error(error.message));
    }
  }

  // Find follow request by actor ID (for older notifications)
  @Get('request/by-actor/:followerId')
  async findFollowRequestByActor(
    @Param('followerId', ParseIntPipe) followerId: number,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const followRequest = await this.followService.findFollowRequestByActor(
        followerId,
        user.id || user.sub,
      );

      if (!followRequest) {
        return res
          .status(404)
          .json(ApiResponseDto.error('Follow request not found'));
      }

      return res.json(
        ApiResponseDto.success(
          'Follow request found successfully',
          followRequest,
        ),
      );
    } catch (error) {
      return res
        .status(error.status || 400)
        .json(ApiResponseDto.error(error.message));
    }
  }
}
