import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KnowledgebaseModule } from './knowledgebase/knowledgebase.module';
import { MistralModule } from './mistral/mistral.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { PrismaService } from './prisma.service.js';
import { UsersService } from './users/users.service.js';
import { UsersController } from './users/users.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    KnowledgebaseModule,
    MistralModule,
    UsersModule
  ],
  controllers: [AppController, UsersController],
  providers: [AppService, PrismaService, UsersService],
})

export class AppModule {}
