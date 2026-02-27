// @ts-nocheck

import { jest } from '@jest/globals'
import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { UserRole } from '../generated/prisma/enums.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuthService } from './auth.service.js'
import { BcryptService } from './bcrypt.service.js'

describe('AuthService', () => {
  let service: AuthService
  let prisma: PrismaService
  let bcryptService: BcryptService

  // Mock data
  const mockUser = {
    id: '01JCEXAMPLE123456789',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.REGISTERED_USER,
    isVerified: true,
    onboardingCompleted: true,
    age: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockOtpCode = {
    id: '01JCEXAMPLE123456789',
    email: 'test@example.com',
    codeHash: 'hashed_code',
    expiresAt: new Date(Date.now() + 600000), // 10 minutes
    attempts: 0,
    createdAt: new Date(),
  }

  const mockContext = {
    deviceId: 'device-123',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            authLog: {
              create: jest.fn(),
            },
            otpCode: {
              create: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            refreshToken: {
              create: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            account: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            device: {
              upsert: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest
              .fn<() => Promise<string>>()
              .mockResolvedValue('mock.jwt.token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                JWT_ACCESS_EXPIRES_IN: '15m',
                JWT_REFRESH_EXPIRES_IN: '30d',
                GOOGLE_CLIENT_ID: 'mock-google-client-id',
                APPLE_CLIENT_ID: 'mock-apple-client-id',
                SMTP_HOST: 'smtp.example.com',
                SMTP_PORT: '587',
                SMTP_USER: 'test@example.com',
                SMTP_PASS: 'password',
                SMTP_FROM: 'Healplace <no-reply@healplace.com>',
              }
              return config[key] ?? defaultValue
            }),
          },
        },
        {
          provide: BcryptService,
          useValue: {
            hash: jest.fn(),
            compare: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    prisma = module.get<PrismaService>(PrismaService)
    bcryptService = module.get<BcryptService>(BcryptService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('TASK-16: logAuthEvent', () => {
    it('should successfully log auth event with all fields', async () => {
      const mockAuthLog = {
        id: '01JCEXAMPLE123456789',
        event: 'otp_verified',
        identifier: 'test@example.com',
        userId: mockUser.id,
        method: 'otp',
        deviceId: 'device-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: { attempts: 1 },
        success: true,
        errorCode: null,
        createdAt: new Date(),
      }

      ;(prisma.authLog.create as jest.Mock).mockResolvedValue(mockAuthLog)

      // Access private method via type assertion
      await (
        service as unknown as {
          logAuthEvent: (params: Record<string, unknown>) => Promise<void>
        }
      ).logAuthEvent({
        event: 'otp_verified',
        identifier: 'test@example.com',
        userId: mockUser.id,
        method: 'otp',
        deviceId: 'device-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: { attempts: 1 },
        success: true,
      })

      expect(prisma.authLog.create).toHaveBeenCalledWith({
        data: {
          event: 'otp_verified',
          identifier: 'test@example.com',
          userId: mockUser.id,
          method: 'otp',
          deviceId: 'device-123',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          metadata: { attempts: 1 },
          success: true,
          errorCode: null,
        },
      })
    })

    it('should log auth event with minimal required fields', async () => {
      ;(prisma.authLog.create as jest.Mock).mockResolvedValue({})

      await (
        service as unknown as {
          logAuthEvent: (params: Record<string, unknown>) => Promise<void>
        }
      ).logAuthEvent({
        event: 'otp_requested',
        success: true,
      })

      expect(prisma.authLog.create).toHaveBeenCalledWith({
        data: {
          event: 'otp_requested',
          identifier: null,
          userId: null,
          method: null,
          deviceId: null,
          ipAddress: null,
          userAgent: null,
          metadata: null,
          success: true,
          errorCode: null,
        },
      })
    })

    it('should log auth event with error code on failure', async () => {
      ;(prisma.authLog.create as jest.Mock).mockResolvedValue({})

      await (
        service as unknown as {
          logAuthEvent: (params: Record<string, unknown>) => Promise<void>
        }
      ).logAuthEvent({
        event: 'otp_failed',
        identifier: 'test@example.com',
        method: 'otp',
        success: false,
        errorCode: 'invalid_code',
      })

      expect(prisma.authLog.create).toHaveBeenCalledWith({
        data: {
          event: 'otp_failed',
          identifier: 'test@example.com',
          userId: null,
          method: 'otp',
          deviceId: null,
          ipAddress: null,
          userAgent: null,
          metadata: null,
          success: false,
          errorCode: 'invalid_code',
        },
      })
    })

    it('should handle database error gracefully and not throw', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {
          /* intentionally empty */
        })
      ;(prisma.authLog.create as jest.Mock).mockRejectedValue(
        new Error('Database connection failed'),
      )

      // Should not throw even if DB write fails
      await expect(
        (
          service as unknown as {
            logAuthEvent: (params: Record<string, unknown>) => Promise<void>
          }
        ).logAuthEvent({
          event: 'otp_verified',
          success: true,
        }),
      ).resolves.not.toThrow()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to log auth event:',
        expect.any(Error),
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle metadata JSON serialization correctly', async () => {
      const complexMetadata = {
        providerId: 'google-123',
        emailVerified: true,
        nested: { key: 'value' },
        array: [1, 2, 3],
      }

      ;(prisma.authLog.create as jest.Mock).mockResolvedValue({})

      await (
        service as unknown as {
          logAuthEvent: (params: Record<string, unknown>) => Promise<void>
        }
      ).logAuthEvent({
        event: 'social_login_success',
        metadata: complexMetadata,
        success: true,
      })

      expect(prisma.authLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: complexMetadata,
        }),
      })
    })

    it('should log pre-auth events with identifier only', async () => {
      ;(prisma.authLog.create as jest.Mock).mockResolvedValue({})

      await (
        service as unknown as {
          logAuthEvent: (params: Record<string, unknown>) => Promise<void>
        }
      ).logAuthEvent({
        event: 'otp_requested',
        identifier: 'test@example.com',
        method: 'otp',
        success: true,
      })

      expect(prisma.authLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event: 'otp_requested',
          identifier: 'test@example.com',
          userId: null, // No userId before auth
        }),
      })
    })

    it('should log post-auth events with userId', async () => {
      ;(prisma.authLog.create as jest.Mock).mockResolvedValue({})

      await (
        service as unknown as {
          logAuthEvent: (params: Record<string, unknown>) => Promise<void>
        }
      ).logAuthEvent({
        event: 'logout',
        userId: mockUser.id,
        success: true,
      })

      expect(prisma.authLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event: 'logout',
          userId: mockUser.id,
        }),
      })
    })
  })

  describe('TASK-17: verifyOtp - Success Path', () => {
    it('should verify OTP successfully, delete OtpCode, and log event', async () => {
      const otpCode = { ...mockOtpCode }
      ;(bcryptService.compare as jest.Mock).mockResolvedValue(true)
      ;(bcryptService.hash as jest.Mock).mockResolvedValue('hashed_refresh_token')
      ;(prisma.otpCode.findFirst as jest.Mock).mockResolvedValue(otpCode)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.otpCode.delete as jest.Mock).mockResolvedValue(otpCode)
      ;(prisma.authLog.create as jest.Mock).mockResolvedValue({})
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        tokenHash: 'hash',
        expiresAt: new Date(),
      })

      const result = await service.verifyOtp(
        'test@example.com',
        '123456',
        mockContext,
      )

      // Verify OTP was deleted (not marked consumed)
      expect(prisma.otpCode.delete).toHaveBeenCalledWith({
        where: { id: otpCode.id },
      })

      // Verify success event was logged
      expect(prisma.authLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event: 'otp_verified',
          identifier: 'test@example.com',
          userId: mockUser.id,
          method: 'otp',
          success: true,
        }),
      })

      // Verify response structure
      expect(result).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        onboarding_required: false,
        user_type: UserRole.REGISTERED_USER,
        login_method: 'otp',
      })
    })

    it('should create new user if email not found', async () => {
      const otpCode = { ...mockOtpCode }
      ;(bcryptService.compare as jest.Mock).mockResolvedValue(true)
      ;(bcryptService.hash as jest.Mock).mockResolvedValue('hashed_refresh_token')
      ;(prisma.otpCode.findFirst as jest.Mock).mockResolvedValue(otpCode)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.otpCode.delete as jest.Mock).mockResolvedValue(otpCode)
      ;(prisma.authLog.create as jest.Mock).mockResolvedValue({})
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        tokenHash: 'hash',
        expiresAt: new Date(),
      })

      await service.verifyOtp('test@example.com', '123456', mockContext)

      // Verify user was created
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          isVerified: true,
          role: UserRole.REGISTERED_USER,
        },
      })
    })

    it('should update isVerified if user exists but not verified', async () => {
      const unverifiedUser = { ...mockUser, isVerified: false }
      const otpCode = { ...mockOtpCode }
      ;(bcryptService.compare as jest.Mock).mockResolvedValue(true)
      ;(bcryptService.hash as jest.Mock).mockResolvedValue('hashed_refresh_token')
      ;(prisma.otpCode.findFirst as jest.Mock).mockResolvedValue(otpCode)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(unverifiedUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        ...unverifiedUser,
        isVerified: true,
      })
      ;(prisma.otpCode.delete as jest.Mock).mockResolvedValue(otpCode)
      ;(prisma.authLog.create as jest.Mock).mockResolvedValue({})
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        tokenHash: 'hash',
        expiresAt: new Date(),
      })

      await service.verifyOtp('test@example.com', '123456', mockContext)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: unverifiedUser.id },
        data: { isVerified: true },
      })
    })
  })

  describe('TASK-17: verifyOtp - Failure Paths', () => {
    it('should increment attempts counter on wrong OTP', async () => {
      const otpCode = { ...mockOtpCode, attempts: 0 }
      ;(bcryptService.compare as jest.Mock).mockResolvedValue(false)
      ;(prisma.otpCode.findFirst as jest.Mock).mockResolvedValue(otpCode)
      ;(prisma.otpCode.update as jest.Mock).mockResolvedValue({
        ...otpCode,
        attempts: 1,
      })
      ;(prisma.authLog.create as jest.Mock).mockResolvedValue({})

      await expect(
        service.verifyOtp('test@example.com', 'wrongcode', mockContext),
      ).rejects.toThrow(BadRequestException)

      // Verify attempts incremented
      expect(prisma.otpCode.update).toHaveBeenCalledWith({
        where: { id: otpCode.id },
        data: { attempts: 1 },
      })

      // Verify failure logged
      expect(prisma.authLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event: 'otp_failed',
          identifier: 'test@example.com',
          success: false,
          errorCode: 'invalid_code',
          metadata: { attempts: 1 },
        }),
      })
    })

    it('should delete OTP and log locked event after 5 failed attempts', async () => {
      const otpCode = { ...mockOtpCode, attempts: 5 }
      ;(prisma.otpCode.findFirst as jest.Mock).mockResolvedValue(otpCode)
      ;(prisma.otpCode.delete as jest.Mock).mockResolvedValue(otpCode)
      ;(prisma.authLog.create as jest.Mock).mockResolvedValue({})

      await expect(
        service.verifyOtp('test@example.com', '123456', mockContext),
      ).rejects.toThrow('Too many incorrect attempts. Request a new OTP.')

      // Verify OTP deleted (locked)
      expect(prisma.otpCode.delete).toHaveBeenCalledWith({
        where: { id: otpCode.id },
      })

      // Verify locked event logged
      expect(prisma.authLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event: 'otp_locked',
          identifier: 'test@example.com',
          success: false,
          errorCode: 'max_attempts_exceeded',
          metadata: { attempts: 5 },
        }),
      })
    })

    it('should log expired event when OTP not found or expired', async () => {
      ;(prisma.otpCode.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.authLog.create as jest.Mock).mockResolvedValue({})

      await expect(
        service.verifyOtp('test@example.com', '123456', mockContext),
      ).rejects.toThrow('OTP not found or expired')

      expect(prisma.authLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event: 'otp_expired',
          identifier: 'test@example.com',
          success: false,
          errorCode: 'otp_not_found_or_expired',
        }),
      })
    })

    it('should handle expired OTP (expiresAt in past)', async () => {
      ;(prisma.otpCode.findFirst as jest.Mock).mockResolvedValue(null) // Query filters expired
      ;(prisma.authLog.create as jest.Mock).mockResolvedValue({})

      await expect(
        service.verifyOtp('test@example.com', '123456', mockContext),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('TASK-17: verifyOtp - Edge Cases', () => {
    it('should require email', async () => {
      await expect(
        service.verifyOtp('', '123456', mockContext),
      ).rejects.toThrow(BadRequestException)

      await expect(
        service.verifyOtp(null as unknown as string, '123456', mockContext),
      ).rejects.toThrow(BadRequestException)
    })

    it('should normalize email to lowercase', async () => {
      const otpCode = { ...mockOtpCode, email: 'test@example.com' }
      ;(bcryptService.compare as jest.Mock).mockResolvedValue(true)
      ;(bcryptService.hash as jest.Mock).mockResolvedValue('hashed_refresh_token')
      ;(prisma.otpCode.findFirst as jest.Mock).mockResolvedValue(otpCode)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.otpCode.delete as jest.Mock).mockResolvedValue(otpCode)
      ;(prisma.authLog.create as jest.Mock).mockResolvedValue({})
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        tokenHash: 'hash',
        expiresAt: new Date(),
      })

      await service.verifyOtp('TEST@EXAMPLE.COM', '123456', mockContext)

      // Verify lookup used normalized email
      expect(prisma.otpCode.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          email: 'test@example.com',
        }),
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should work without context (optional parameters)', async () => {
      const otpCode = { ...mockOtpCode }
      ;(bcryptService.compare as jest.Mock).mockResolvedValue(true)
      ;(bcryptService.hash as jest.Mock).mockResolvedValue('hashed_refresh_token')
      ;(prisma.otpCode.findFirst as jest.Mock).mockResolvedValue(otpCode)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.otpCode.delete as jest.Mock).mockResolvedValue(otpCode)
      ;(prisma.authLog.create as jest.Mock).mockResolvedValue({})
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        tokenHash: 'hash',
        expiresAt: new Date(),
      })

      await service.verifyOtp('test@example.com', '123456')

      // Verify log was called with null context fields (not provided)
      expect(prisma.authLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceId: null,
          ipAddress: null,
          userAgent: null,
        }),
      })
    })
  })
})
