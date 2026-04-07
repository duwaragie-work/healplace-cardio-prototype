import { jest } from '@jest/globals'
import { Test, TestingModule } from '@nestjs/testing'
import { EmbeddingService } from '../common/embedding.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { KnowledgebaseService } from './knowledgebase.service.js'

describe('KnowledgebaseService', () => {
  let service: KnowledgebaseService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgebaseService,
        {
          provide: PrismaService,
          useValue: {
            document: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            documentVector: {
              createMany: jest.fn(),
            },
          },
        },
        {
          provide: EmbeddingService,
          useValue: {
            getEmbeddings: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<KnowledgebaseService>(KnowledgebaseService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
