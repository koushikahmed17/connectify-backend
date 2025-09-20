import { Module } from '@nestjs/common';
import { CallsGateway } from './calls.gateway';
import { CallsService } from './calls.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from '../../shared/config/jwt-config.service';
import { DatabaseModule } from '../../shared/database/database.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    DatabaseModule,
  ],
  providers: [CallsGateway, CallsService],
  exports: [CallsService],
})
export class CallsModule {}



