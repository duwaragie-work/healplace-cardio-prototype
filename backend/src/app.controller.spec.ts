import { jest } from '@jest/globals'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { EmailService } from './email/email.service.js'

describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => defaultValue),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendOtp: jest.fn(),
          },
        },
      ],
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe(
        'Hello World v2.13!',
      )
    })
  })
})
