import { Module } from '@nestjs/common';
import { UserProfileController } from './userprofile.controller';
import { UserProfileService } from './userprofile.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecretkey',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [UserProfileController],
  providers: [UserProfileService, PrismaService],
})
export class UserProfileModule {}
