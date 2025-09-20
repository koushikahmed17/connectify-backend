import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';

@Injectable()
export class JwtConfigService implements JwtOptionsFactory {
  constructor(private configService: ConfigService) {}

  createJwtOptions(): JwtModuleOptions {
    return {
      secret: this.secret,
      signOptions: {
        expiresIn: this.expiresIn,
      },
    };
  }

  get secret(): string {
    return this.configService.get<string>('JWT_SECRET', 'supersecretkey');
  }

  get expiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '1d');
  }

  get refreshSecret(): string {
    return this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'supersecretrefreshkey',
    );
  }

  get refreshExpiresIn(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
  }
}
