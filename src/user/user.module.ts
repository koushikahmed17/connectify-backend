import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserProfileModule } from './userprofile/userprofile.module';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [AuthModule, UserProfileModule, PostsModule],
})
export class UserModule {}
