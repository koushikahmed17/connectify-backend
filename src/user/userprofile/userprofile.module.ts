import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UserProfileController } from './userprofile.controller';
import { UserProfileService } from './userprofile.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { MediaModule } from '../../media/media.module';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecretkey',
      signOptions: { expiresIn: '1d' },
    }),
    MediaModule,
    MulterModule.register({
      storage: memoryStorage(), // Use memory storage instead of disk storage
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 2, // Maximum 2 files
      },
    }),
  ],
  controllers: [UserProfileController],
  providers: [UserProfileService, PrismaService],
  exports: [UserProfileService],
})
export class UserProfileModule {}
