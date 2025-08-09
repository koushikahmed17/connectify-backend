import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { UserProfileService } from './userprofile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // your JWT guard
import { CurrentUserId } from '../../common/decorators/user.decorator';

@UseGuards(JwtAuthGuard) // protect all routes here
@Controller('user/profile')
export class UserProfileController {
  constructor(private readonly profileService: UserProfileService) {}

  @Get()
  async getProfile(@CurrentUserId() userId: number) {
    return this.profileService.getProfileByUserId(userId);
  }

  @Post()
  async createProfile(
    @CurrentUserId() userId: number,
    @Body() dto: CreateProfileDto,
  ) {
    console.log('userId:', userId);
    console.log('dto:', dto);
    return this.profileService.createProfile(userId, dto);
  }

  @Put()
  async updateProfile(
    @CurrentUserId() userId: number,
    @Body() dto: CreateProfileDto,
  ) {
    return this.profileService.updateProfile(userId, dto);
  }
}
