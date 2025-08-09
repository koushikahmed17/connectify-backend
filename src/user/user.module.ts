import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserProfileModule } from './userprofile/userprofile.module';

@Module({
  imports: [AuthModule, UserProfileModule],
})
export class UserModule {}
