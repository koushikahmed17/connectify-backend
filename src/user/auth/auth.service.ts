import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existingUser) {
      throw new BadRequestException('Email or username already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashedPassword,
      },
    });

    return { message: 'User registered successfully', userId: user.id };
  }

  async login(dto: LoginDto, res: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        profile: {
          include: {
            avatar: true,
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Return user data with profile information
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      profile: user.profile
        ? {
            displayName: user.profile.displayName,
            avatar: user.profile.avatar
              ? {
                  url: user.profile.avatar.url,
                }
              : undefined,
          }
        : undefined,
    };

    return res.json({
      message: 'Login successful',
      access_token: token,
      user: userData,
    });
  }

  async logout(res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return { message: 'Logout successful' };
  }
  async getUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            avatar: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      profile: user.profile
        ? {
            displayName: user.profile.displayName,
            avatar: user.profile.avatar
              ? {
                  url: user.profile.avatar.url,
                }
              : undefined,
          }
        : undefined,
    };
  }
}
