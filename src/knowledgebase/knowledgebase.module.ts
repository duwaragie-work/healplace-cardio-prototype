import { Module } from '@nestjs/common';
import { KnowledgebaseController } from './knowledgebase.controller.js';
import { KnowledgebaseService } from './knowledgebase.service.js';
import { MistralModule } from '../mistral/mistral.module.js';

@Module({
  imports: [MistralModule],
  controllers: [KnowledgebaseController],
  providers: [KnowledgebaseService]
})
export class KnowledgebaseModule {}
