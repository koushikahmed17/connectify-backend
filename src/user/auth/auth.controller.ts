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
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Request as ExpressRequest, Response } from 'express';

import { JwtAuthGuard } from './jwt-auth.guard'; // import your JWT guard

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    return this.authService.login(dto, res);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  // New GET /auth/me endpoint
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: ExpressRequest, @Res() res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await this.authService.getUserById(
      req.user.sub || req.user.id,
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  }
}
