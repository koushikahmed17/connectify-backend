import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Debug: Log request details
    console.log('🔐 JWT Guard - Request URL:', request.url);
    console.log('🔐 JWT Guard - Request headers:', request.headers);
    console.log('🔐 JWT Guard - Request cookies:', request.cookies);
    console.log(
      '🔐 JWT Guard - Authorization header:',
      request.headers.authorization,
    );

    const token =
      this.extractTokenFromHeader(request) ||
      this.extractTokenFromCookie(request);

    console.log(
      '🔐 JWT Guard - Extracted token:',
      token ? 'Token found' : 'No token',
    );

    if (!token) {
      throw new UnauthorizedException('No token found');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'supersecretkey',
      });
      // Quick fix to avoid TS error:
      (request as any).user = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' && token ? token : null;
  }

  private extractTokenFromCookie(request: Request): string | null {
    return request.cookies?.access_token || null;
  }
}
