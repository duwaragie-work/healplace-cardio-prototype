import { jest } from '@jest/globals'
import { Test, TestingModule } from '@nestjs/testing'
import { KnowledgebaseController } from './knowledgebase.controller.js'
import { KnowledgebaseService } from './knowledgebase.service.js'

describe('KnowledgebaseController', () => {
  let controller: KnowledgebaseController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KnowledgebaseController],
      providers: [
        {
          provide: KnowledgebaseService,
          useValue: {
            processDocument: jest.fn(),
            findDocumentByName: jest.fn(),
            getDocuments: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<KnowledgebaseController>(KnowledgebaseController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
