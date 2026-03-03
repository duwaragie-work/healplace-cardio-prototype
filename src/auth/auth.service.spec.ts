// @ts-nocheck

import { jest } from '@jest/globals'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { validate } from 'class-validator'
import { MenopauseStage, UserRole } from '../generated/prisma/enums.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuthService } from './auth.service.js'
import { BcryptService } from './bcrypt.service.js'
import { OnboardingDto } from './dto/onboarding.dto.js'

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
    dateOfBirth: null,
    menopauseStage: MenopauseStage.UNKNOWN,
    timezone: null,
    primarySymptoms: null,
    primarySymptomsOtherText: null,
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
      ;(bcryptService.hash as jest.Mock).mockResolvedValue(
        'hashed_refresh_token',
      )
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
      ;(bcryptService.hash as jest.Mock).mockResolvedValue(
        'hashed_refresh_token',
      )
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
      ;(bcryptService.hash as jest.Mock).mockResolvedValue(
        'hashed_refresh_token',
      )
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
      ;(bcryptService.hash as jest.Mock).mockResolvedValue(
        'hashed_refresh_token',
      )
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
      ;(bcryptService.hash as jest.Mock).mockResolvedValue(
        'hashed_refresh_token',
      )
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

  // ─── OnboardingDto validation ────────────────────────────────────────────────

  describe('OnboardingDto validation', () => {
    it('should pass with an empty DTO (all fields optional)', async () => {
      const dto = Object.assign(new OnboardingDto(), {})
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should pass with a full valid DTO', async () => {
      const dto = Object.assign(new OnboardingDto(), {
        name: 'Alice',
        dateOfBirth: '1986-04-12',
        menopauseStage: 'PERIMENOPAUSE',
        timezone: 'America/New_York',
        primarySymptoms: ['hot_flashes', 'anxiety'],
        primarySymptomsOtherText: 'Some other text',
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject a name longer than 100 characters', async () => {
      const dto = Object.assign(new OnboardingDto(), { name: 'A'.repeat(101) })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'name')).toBe(true)
    })

    it('should reject a dateOfBirth that is in the future', async () => {
      const futureDate = new Date(Date.now() + 86_400_000)
        .toISOString()
        .slice(0, 10)
      const dto = Object.assign(new OnboardingDto(), {
        dateOfBirth: futureDate,
      })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'dateOfBirth')).toBe(true)
    })

    it('should reject an invalid dateOfBirth format', async () => {
      const dto = Object.assign(new OnboardingDto(), {
        dateOfBirth: '12-04-1986',
      })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'dateOfBirth')).toBe(true)
    })

    it('should reject an invalid menopauseStage value', async () => {
      const dto = Object.assign(new OnboardingDto(), {
        menopauseStage: 'INVALID_STAGE',
      })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'menopauseStage')).toBe(true)
    })

    it('should reject a timezone without a slash', async () => {
      const dto = Object.assign(new OnboardingDto(), { timezone: 'UTC' })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'timezone')).toBe(true)
    })

    it('should reject primarySymptoms containing an unknown identifier', async () => {
      const dto = Object.assign(new OnboardingDto(), {
        primarySymptoms: ['hot_flashes', 'unknown_symptom'],
      })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'primarySymptoms')).toBe(true)
    })

    it('should allow an empty primarySymptoms array ("not sure yet" UX)', async () => {
      const dto = Object.assign(new OnboardingDto(), { primarySymptoms: [] })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  // ─── completeOnboarding service method ───────────────────────────────────────

  describe('completeOnboarding', () => {
    it('should always set onboardingCompleted = true even with an empty DTO', async () => {
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        name: mockUser.name,
        dateOfBirth: null,
        menopauseStage: MenopauseStage.UNKNOWN,
        timezone: null,
        primarySymptoms: null,
        primarySymptomsOtherText: null,
        onboardingCompleted: true,
      })

      const result = await service.completeOnboarding(mockUser.id, {})
      expect(result).toMatchObject({
        message: 'Onboarding completed',
        name: mockUser.name,
        onboardingCompleted: true,
      })
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({ onboardingCompleted: true }),
          select: {
            name: true,
            dateOfBirth: true,
            menopauseStage: true,
            timezone: true,
            primarySymptoms: true,
            primarySymptomsOtherText: true,
            onboardingCompleted: true,
          },
        }),
      )
    })

    it('should persist all provided profile fields', async () => {
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        name: 'Alice',
        dateOfBirth: null,
        menopauseStage: MenopauseStage.PERIMENOPAUSE,
        timezone: 'Asia/Colombo',
        primarySymptoms: ['hot_flashes', 'anxiety'],
        primarySymptomsOtherText: null,
        onboardingCompleted: true,
      })

      await service.completeOnboarding(mockUser.id, {
        name: 'Alice',
        menopauseStage: 'PERIMENOPAUSE',
        timezone: 'Asia/Colombo',
        primarySymptoms: ['hot_flashes', 'anxiety'],
      })

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            name: 'Alice',
            menopauseStage: 'PERIMENOPAUSE',
            timezone: 'Asia/Colombo',
            primarySymptoms: ['hot_flashes', 'anxiety'],
            onboardingCompleted: true,
          }),
          select: {
            name: true,
            dateOfBirth: true,
            menopauseStage: true,
            timezone: true,
            primarySymptoms: true,
            primarySymptomsOtherText: true,
            onboardingCompleted: true,
          },
        }),
      )
    })

    it('should store dateOfBirth as a Date when provided', async () => {
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser })

      await service.completeOnboarding(mockUser.id, {
        dateOfBirth: '1986-04-12',
      })

      const call = (prisma.user.update as jest.Mock).mock.calls[0][0]
      expect(call.data.dateOfBirth).toEqual(new Date('1986-04-12'))
    })

    it('should leave dateOfBirth out of the patch when not provided', async () => {
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser })

      await service.completeOnboarding(mockUser.id, { name: 'Alice' })

      const call = (prisma.user.update as jest.Mock).mock.calls[0][0]
      expect(call.data).not.toHaveProperty('dateOfBirth')
    })

    it('should not include fields that were not provided in the DTO', async () => {
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser })

      await service.completeOnboarding(mockUser.id, { name: 'Bob' })

      const call = (prisma.user.update as jest.Mock).mock.calls[0][0]
      // These keys should not appear in the update payload
      expect(call.data).not.toHaveProperty('timezone')
      expect(call.data).not.toHaveProperty('primarySymptoms')
      expect(call.data).not.toHaveProperty('menopauseStage')
    })
  })

  // ─── getProfile ──────────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('should return selected user fields', async () => {
      const profileData = {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        isVerified: mockUser.isVerified,
        onboardingCompleted: mockUser.onboardingCompleted,
        dateOfBirth: null,
        menopauseStage: MenopauseStage.UNKNOWN,
        timezone: 'Asia/Colombo',
        primarySymptoms: ['hot_flashes'],
        primarySymptomsOtherText: null,
        createdAt: mockUser.createdAt,
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(profileData)

      const result = await service.getProfile(mockUser.id)
      expect(result).toEqual(profileData)
    })

    it('should throw NotFoundException when user does not exist', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(service.getProfile('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
