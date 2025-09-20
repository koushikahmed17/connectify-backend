import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { JwtConfigService } from '../../shared/config/jwt-config.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

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
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, JwtAuthGuard],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
