import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Prisma } from '../generated/prisma/client.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { JOURNAL_EVENTS } from './constants/events.js'
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto.js'
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto.js'

@Injectable()
export class DailyJournalService {
  private readonly logger = new Logger(DailyJournalService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateJournalEntryDto) {
    try {
      const entry = await this.prisma.journalEntry.create({
        data: {
          userId,
          entryDate: new Date(dto.entryDate),
          sleepHours: new Prisma.Decimal(dto.sleepHours),
          sleepQuality: dto.sleepQuality,
          awakenings: dto.awakenings,
          notes: dto.notes ?? null,
        },
      })

      this.eventEmitter.emit(JOURNAL_EVENTS.ENTRY_CREATED, {
        userId,
        entryId: entry.id,
        entryDate: entry.entryDate,
        sleepHours: Number(entry.sleepHours),
        sleepQuality: entry.sleepQuality,
        awakenings: entry.awakenings,
      })

      return {
        statusCode: 202,
        message: 'Journal entry accepted. Background analysis in progress.',
        data: this.serializeEntry(entry),
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A journal entry already exists for this date',
        )
      }

      this.logger.error('Failed to create journal entry', error)
      throw new InternalServerErrorException(
        'An unexpected error occurred while saving the journal entry',
      )
    }
  }

  async update(userId: string, entryId: string, dto: UpdateJournalEntryDto) {
    const existing = await this.prisma.journalEntry.findFirst({
      where: { id: entryId, userId },
    })

    if (!existing) {
      throw new NotFoundException('Journal entry not found')
    }

    try {
      const updated = await this.prisma.journalEntry.update({
        where: { id: entryId },
        data: {
          ...(dto.entryDate && { entryDate: new Date(dto.entryDate) }),
          ...(dto.sleepHours !== undefined && {
            sleepHours: new Prisma.Decimal(dto.sleepHours),
          }),
          ...(dto.sleepQuality !== undefined && {
            sleepQuality: dto.sleepQuality,
          }),
          ...(dto.awakenings !== undefined && {
            awakenings: dto.awakenings,
          }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
      })

      this.eventEmitter.emit(JOURNAL_EVENTS.ENTRY_UPDATED, {
        userId,
        entryId: updated.id,
        entryDate: updated.entryDate,
        sleepHours: Number(updated.sleepHours),
        sleepQuality: updated.sleepQuality,
        awakenings: updated.awakenings,
      })

      return {
        statusCode: 202,
        message:
          'Journal entry updated. Background re-analysis in progress.',
        data: this.serializeEntry(updated),
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A journal entry already exists for this date',
        )
      }

      this.logger.error('Failed to update journal entry', error)
      throw new InternalServerErrorException(
        'An unexpected error occurred while updating the journal entry',
      )
    }
  }

  async findAll(userId: string) {
    const entries = await this.prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { entryDate: 'desc' },
    })

    return {
      statusCode: 200,
      message: 'Journal entries retrieved successfully',
      data: entries.map((entry) => this.serializeEntry(entry)),
    }
  }

  async getHistory(
    userId: string,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit

    const [entries, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { entryDate: 'desc' },
        skip,
        take: limit,
        include: {
          snapshot: {
            select: {
              id: true,
              computedForDate: true,
              baselineSleepHours: true,
              baselineSleepQuality: true,
              baselineAwakenings: true,
            },
          },
          deviationAlerts: {
            select: {
              id: true,
              type: true,
              severity: true,
              magnitude: true,
              baselineValue: true,
              actualValue: true,
              consecutiveDays: true,
              escalated: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.journalEntry.count({ where: { userId } }),
    ])

    return {
      statusCode: 200,
      message: 'Journal history retrieved successfully',
      data: entries.map((entry) => ({
        id: entry.id,
        entryDate: entry.entryDate,
        sleepHours: Number(entry.sleepHours),
        sleepQuality: entry.sleepQuality,
        awakenings: entry.awakenings,
        notes: entry.notes,
        baseline: entry.snapshot
          ? {
              id: entry.snapshot.id,
              baselineSleepHours: entry.snapshot.baselineSleepHours
                ? Number(entry.snapshot.baselineSleepHours)
                : 0,
              baselineSleepQuality: entry.snapshot.baselineSleepQuality
                ? Number(entry.snapshot.baselineSleepQuality)
                : 0,
              baselineAwakenings: entry.snapshot.baselineAwakenings
                ? Number(entry.snapshot.baselineAwakenings)
                : 0,
            }
          : null,
        deviations: entry.deviationAlerts.map((a) => ({
          id: a.id,
          type: a.type,
          severity: a.severity,
          magnitude: Number(a.magnitude),
          baselineValue: a.baselineValue ? Number(a.baselineValue) : null,
          actualValue: a.actualValue ? Number(a.actualValue) : null,
          consecutiveDays: a.consecutiveDays,
          escalated: a.escalated,
          status: a.status,
        })),
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findOne(userId: string, id: string) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, userId },
    })

    if (!entry) {
      throw new NotFoundException('Journal entry not found')
    }

    return {
      statusCode: 200,
      message: 'Journal entry retrieved successfully',
      data: this.serializeEntry(entry),
    }
  }

  async getAlerts(userId: string) {
    const alerts = await this.prisma.deviationAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        journalEntry: {
          select: {
            id: true,
            entryDate: true,
            sleepHours: true,
            sleepQuality: true,
            awakenings: true,
          },
        },
      },
    })

    return {
      statusCode: 200,
      message: 'Alerts retrieved successfully',
      data: alerts.map((alert) => ({
        ...alert,
        magnitude: Number(alert.magnitude),
        baselineValue: alert.baselineValue
          ? Number(alert.baselineValue)
          : null,
        actualValue: alert.actualValue ? Number(alert.actualValue) : null,
        journalEntry: alert.journalEntry
          ? {
              ...alert.journalEntry,
              sleepHours: Number(alert.journalEntry.sleepHours),
            }
          : null,
      })),
    }
  }

  async acknowledgeAlert(userId: string, alertId: string) {
    const alert = await this.prisma.deviationAlert.findFirst({
      where: { id: alertId, userId },
    })

    if (!alert) {
      throw new NotFoundException('Alert not found')
    }

    if (alert.status === 'ACKNOWLEDGED') {
      return {
        statusCode: 200,
        message: 'Alert already acknowledged',
        data: alert,
      }
    }

    const updated = await this.prisma.deviationAlert.update({
      where: { id: alertId },
      data: { status: 'ACKNOWLEDGED', acknowledgedAt: new Date() },
    })

    return {
      statusCode: 200,
      message: 'Alert acknowledged',
      data: updated,
    }
  }

  async getNotifications(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
    })

    return {
      statusCode: 200,
      message: 'Notifications retrieved successfully',
      data: notifications,
    }
  }

  async getLatestBaseline(userId: string) {
    const snapshot = await this.prisma.baselineSnapshot.findFirst({
      where: { userId },
      orderBy: { computedForDate: 'desc' },
    })

    if (!snapshot) {
      return {
        statusCode: 200,
        message: 'No baseline available yet',
        data: null,
      }
    }

    return {
      statusCode: 200,
      message: 'Baseline retrieved successfully',
      data: {
        id: snapshot.id,
        userId: snapshot.userId,
        computedForDate: snapshot.computedForDate,
        baselineSleepHours: snapshot.baselineSleepHours
          ? Number(snapshot.baselineSleepHours)
          : null,
        baselineSleepQuality: snapshot.baselineSleepQuality
          ? Number(snapshot.baselineSleepQuality)
          : null,
        baselineAwakenings: snapshot.baselineAwakenings
          ? Number(snapshot.baselineAwakenings)
          : null,
        createdAt: snapshot.createdAt,
      },
    }
  }

  private serializeEntry(entry: {
    id: string
    userId: string
    entryDate: Date
    sleepHours: Prisma.Decimal | number
    sleepQuality: number
    awakenings: number
    notes: string | null
    snapshotId: string | null
    createdAt: Date
    updatedAt: Date
  }) {
    return {
      id: entry.id,
      userId: entry.userId,
      entryDate: entry.entryDate,
      sleepHours: Number(entry.sleepHours),
      sleepQuality: entry.sleepQuality,
      awakenings: entry.awakenings,
      notes: entry.notes,
      snapshotId: entry.snapshotId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }
  }
}
