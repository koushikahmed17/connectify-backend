import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  VerifyOTPDto,
  ResetPasswordDto,
  GoogleAuthDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ApiResponseDto } from '../../shared/dto/api-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async register(@Body() dto: RegisterDto): Promise<ApiResponseDto> {
    const result = await this.authService.register(dto);
    return ApiResponseDto.success(result.message, { userId: result.userId });
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(dto, res);
    return res.json(result);
  }

  @Post('logout')
  async logout(
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponseDto> {
    const result = await this.authService.logout(res);
    return ApiResponseDto.success(result.message);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any, @Res() res: Response) {
    if (!user) {
      return res.status(401).json(ApiResponseDto.error('Unauthorized'));
    }

    const userData = await this.authService.getUserById(user.id || user.sub);

    if (!userData) {
      return res.status(404).json(ApiResponseDto.error('User not found'));
    }

    return res.json(
      ApiResponseDto.success('User data retrieved successfully', userData),
    );
  }

  @Post('forgot-password')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<ApiResponseDto> {
    const result = await this.authService.forgotPassword(dto.email);
    return ApiResponseDto.success(result.message);
  }

  @Post('verify-otp')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async verifyOTP(@Body() dto: VerifyOTPDto): Promise<ApiResponseDto> {
    const result = await this.authService.verifyOTP(dto.email, dto.otp);
    return ApiResponseDto.success(result.message);
  }

  @Post('resend-otp')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async resendOTP(@Body() dto: ForgotPasswordDto): Promise<ApiResponseDto> {
    const result = await this.authService.resendOTP(dto.email);
    return ApiResponseDto.success(result.message);
  }

  @Post('reset-password')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<ApiResponseDto> {
    const result = await this.authService.resetPassword(
      dto.email,
      dto.otp,
      dto.newPassword,
    );
    return ApiResponseDto.success(result.message);
  }

  @Post('google')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async googleAuth(@Body() dto: GoogleAuthDto, @Res() res: Response) {
    const result = await this.authService.googleAuth(dto, res);
    return res.json(result);
  }

  @Get('google/url')
  async getGoogleAuthUrl(): Promise<ApiResponseDto> {
    const authUrl = this.authService.getGoogleAuthUrl();
    return ApiResponseDto.success('Google auth URL generated', { authUrl });
  }
}
