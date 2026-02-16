import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { PrismaService } from './prisma.service.js';
import { UsersService } from './users/users.service.js';
import { UsersController } from './users/users.controller.js';

@Module({
  imports: [UsersModule],
  controllers: [AppController, UsersController],
  providers: [AppService, PrismaService, UsersService],

})
export class AppModule {}
