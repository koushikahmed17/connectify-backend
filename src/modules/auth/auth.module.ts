import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtConfigService } from '../../shared/config/jwt-config.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { EmailService } from '../../shared/services/email.service';
import { OtpService } from '../../shared/services/otp.service';
import { GoogleAuthService } from '../../shared/services/google-auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (jwtConfigService: JwtConfigService) => ({
        secret: jwtConfigService.secret,
        signOptions: { expiresIn: jwtConfigService.expiresIn },
      }),
      inject: [JwtConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    EmailService,
    OtpService,
    GoogleAuthService,
  ],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
