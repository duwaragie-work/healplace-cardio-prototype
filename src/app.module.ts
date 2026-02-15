import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KnowledgebaseModule } from './knowledgebase/knowledgebase.module';
import { MistralModule } from './mistral/mistral.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    KnowledgebaseModule,
    MistralModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
