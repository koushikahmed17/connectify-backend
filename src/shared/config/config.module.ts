import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppConfigService } from './app-config.service';
import { DatabaseConfigService } from './database-config.service';
import { JwtConfigService } from './jwt-config.service';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  providers: [AppConfigService, DatabaseConfigService, JwtConfigService],
  exports: [AppConfigService, DatabaseConfigService, JwtConfigService],
})
export class ConfigModule {}

