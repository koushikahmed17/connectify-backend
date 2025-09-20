import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FollowController } from './follow.controller';
import { FollowService } from './follow.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtConfigService } from '../../shared/config/jwt-config.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@Module({
  imports: [
    NotificationsModule,
    JwtModule.registerAsync({
      useFactory: (jwtConfigService: JwtConfigService) => ({
        secret: jwtConfigService.secret,
        signOptions: { expiresIn: jwtConfigService.expiresIn },
      }),
      inject: [JwtConfigService],
    }),
  ],
  controllers: [FollowController],
  providers: [FollowService, PrismaService, JwtAuthGuard, JwtConfigService],
  exports: [FollowService],
})
export class FollowModule {}
