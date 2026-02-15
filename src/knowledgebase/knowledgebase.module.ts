import { Module } from '@nestjs/common';
import { KnowledgebaseController } from './knowledgebase.controller';
import { KnowledgebaseService } from './knowledgebase.service';
import { MistralModule } from '../mistral/mistral.module';

@Module({
  imports: [MistralModule],
  controllers: [KnowledgebaseController],
  providers: [KnowledgebaseService]
})
export class KnowledgebaseModule {}
