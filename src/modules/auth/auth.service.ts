import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { PrismaService } from '../../shared/database/prisma.service';
import { JwtConfigService } from '../../shared/config/jwt-config.service';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  GoogleAuthDto,
} from './dto/auth.dto';
import { EmailService } from '../../shared/services/email.service';
import { OtpService } from '../../shared/services/otp.service';
import { GoogleAuthService } from '../../shared/services/google-auth.service';
import {
  ResourceAlreadyExistsException,
  InvalidCredentialsException,
} from '../../shared/exceptions/business.exceptions';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly jwtConfigService: JwtConfigService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ message: string; userId: number }> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existingUser) {
      throw new ResourceAlreadyExistsException(
        'Email or username already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashedPassword,
      },
    });

    return {
      message: 'User registered successfully',
      userId: user.id,
    };
  }

  async login(dto: LoginDto, res: Response): Promise<AuthResponseDto> {
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

    if (!user) {
      throw new InvalidCredentialsException();
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new InvalidCredentialsException();
    }

    const payload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      profile: user.profile
        ? {
            displayName: user.profile.displayName || undefined,
            avatar: user.profile.avatar
              ? {
                  url: user.profile.avatar.url,
                }
              : undefined,
          }
        : undefined,
    };

    return {
      success: true,
      message: 'Login successful',
      access_token: token,
      user: userData,
    };
  }

  async logout(res: Response): Promise<{ message: string }> {
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
            displayName: user.profile.displayName || undefined,
            avatar: user.profile.avatar
              ? {
                  url: user.profile.avatar.url,
                }
              : undefined,
          }
        : undefined,
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: 'If the email exists, an OTP has been sent' };
    }

    // Generate OTP
    const otp = this.otpService.generateOTP();

    // Store OTP
    this.otpService.storeOTP(email, otp);

    // Send OTP email
    try {
      await this.emailService.sendOTPEmail(email, otp);
      return { message: 'If the email exists, an OTP has been sent' };
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new BadRequestException('Failed to send OTP email');
    }
  }

  async verifyOTP(email: string, otp: string): Promise<{ message: string }> {
    const verification = this.otpService.verifyOTP(email, otp);

    if (!verification.isValid) {
      throw new BadRequestException(verification.message);
    }

    return { message: 'OTP verified successfully' };
  }

  async resendOTP(email: string): Promise<{ message: string }> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { message: 'If the email exists, an OTP has been sent' };
    }

    // Check if there's already a valid OTP
    if (this.otpService.isOTPValid(email)) {
      throw new BadRequestException(
        'OTP already sent. Please wait before requesting a new one.',
      );
    }

    // Generate new OTP
    const otp = this.otpService.generateOTP();

    // Store OTP
    this.otpService.storeOTP(email, otp);

    // Send OTP email
    try {
      await this.emailService.sendOTPEmail(email, otp);
      return { message: 'If the email exists, an OTP has been sent' };
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new BadRequestException('Failed to send OTP email');
    }
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Verify OTP first
    const verification = this.otpService.verifyOTP(email, otp);

    if (!verification.isValid) {
      throw new BadRequestException(verification.message);
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Send success email
    try {
      await this.emailService.sendPasswordResetSuccessEmail(email);
    } catch (error) {
      console.error('Error sending success email:', error);
      // Don't throw error for success email
    }

    return { message: 'Password reset successfully' };
  }

  async googleAuth(
    dto: GoogleAuthDto,
    res: Response,
  ): Promise<AuthResponseDto> {
    try {
      // Verify Google token
      const googleUser = await this.googleAuthService.verifyGoogleToken(
        dto.token,
      );

      // Check if user exists with this email
      let user = await this.prisma.user.findUnique({
        where: { email: googleUser.email },
        include: {
          profile: {
            include: {
              avatar: true,
            },
          },
        },
      });

      // If user doesn't exist, create new user
      if (!user) {
        // Generate a unique username from email
        const baseUsername = googleUser.email.split('@')[0];
        let username = baseUsername;
        let counter = 1;

        // Ensure username is unique
        while (await this.prisma.user.findUnique({ where: { username } })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        // Create user
        user = await this.prisma.user.create({
          data: {
            email: googleUser.email,
            username,
            password: '', // No password for Google OAuth users
            googleId: googleUser.googleId,
            isEmailVerified: true, // Google emails are pre-verified
          },
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        });

        // Create avatar first if picture exists
        let avatarId: number | undefined;
        if (googleUser.picture) {
          const avatar = await this.prisma.media.create({
            data: {
              url: googleUser.picture,
              mimeType: 'image/jpeg',
            },
          });
          avatarId = avatar.id;
        }

        // Create profile
        await this.prisma.profile.create({
          data: {
            userId: user.id,
            displayName: googleUser.name,
            avatarId: avatarId,
          },
        });

        // Refresh user data with profile
        user = await this.prisma.user.findUnique({
          where: { id: user.id },
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        });
      } else {
        // Update existing user with Google ID if not set
        if (!user.googleId) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { googleId: googleUser.googleId },
            include: {
              profile: {
                include: {
                  avatar: true,
                },
              },
            },
          });
        }
      }

      // Ensure user is not null after all operations
      if (!user) {
        throw new BadRequestException('User creation failed');
      }

      // Generate JWT token
      const payload = {
        sub: user.id,
        email: user.email,
        username: user.username,
      };

      const accessToken = this.jwtService.sign(payload, {
        secret: this.jwtConfigService.secret,
        expiresIn: this.jwtConfigService.expiresIn,
      });

      // Set HTTP-only cookie
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return {
        success: true,
        message: 'Google authentication successful',
        access_token: accessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          profile: user.profile
            ? {
                displayName: user.profile.displayName || undefined,
                avatar: user.profile.avatar
                  ? {
                      url: user.profile.avatar.url,
                    }
                  : undefined,
              }
            : undefined,
        },
      };
    } catch (error) {
      console.error('Google authentication error:', error);
      throw new BadRequestException('Google authentication failed');
    }
  }

  getGoogleAuthUrl(): string {
    return this.googleAuthService.getGoogleAuthUrl();
  }
}
