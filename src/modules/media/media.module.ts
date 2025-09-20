import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { JwtConfigService } from '../../shared/config/jwt-config.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { ConfigModule } from '../../shared/config/config.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      useFactory: (jwtConfigService: JwtConfigService) => ({
        secret: jwtConfigService.secret,
        signOptions: { expiresIn: jwtConfigService.expiresIn },
      }),
      inject: [JwtConfigService],
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, JwtAuthGuard],
  exports: [MediaService],
})
export class MediaModule {}
