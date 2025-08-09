import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect(); // connect to the DB when the module initializes
  }

  async onModuleDestroy() {
    await this.$disconnect(); // disconnect when the module is destroyed
  }
}
