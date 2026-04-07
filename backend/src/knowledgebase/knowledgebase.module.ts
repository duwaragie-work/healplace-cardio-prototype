import { Module } from '@nestjs/common'
import { KnowledgebaseController } from './knowledgebase.controller.js'
import { KnowledgebaseService } from './knowledgebase.service.js'

@Module({
  controllers: [KnowledgebaseController],
  providers: [KnowledgebaseService],
})
export class KnowledgebaseModule {}
