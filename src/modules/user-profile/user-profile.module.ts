import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserProfileController } from './user-profile.controller';
import { UserProfileService } from './user-profile.service';
import { MediaModule } from '../media/media.module';
import { JwtConfigService } from '../../shared/config/jwt-config.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@Module({
  imports: [
    MediaModule,
    JwtModule.registerAsync({
      useFactory: (jwtConfigService: JwtConfigService) => ({
        secret: jwtConfigService.secret,
        signOptions: { expiresIn: jwtConfigService.expiresIn },
      }),
      inject: [JwtConfigService],
    }),
  ],
  controllers: [UserProfileController],
  providers: [UserProfileService, JwtAuthGuard],
  exports: [UserProfileService],
})
export class UserProfileModule {}
