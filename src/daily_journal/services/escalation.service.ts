import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { PrismaService } from '../../prisma/prisma.service.js'
import { JOURNAL_EVENTS } from '../constants/events.js'
import type { AnomalyTrackedEvent } from '../interfaces/events.interface.js'

@Injectable()
export class EscalationService {
  private readonly logger = new Logger(EscalationService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(JOURNAL_EVENTS.ANOMALY_TRACKED, { async: true })
  async handleAnomalyTracked(payload: AnomalyTrackedEvent) {
    try {
      // Escalation only triggers at 3+ consecutive days of deviation.
      // Days 1–2 are just tracked alerts — no escalation, no notification.
      if (payload.consecutiveDays < 3) {
        this.logger.log(
          `Alert ${payload.alertId}: ${payload.consecutiveDays} consecutive day(s) — below escalation threshold (need 3+)`,
        )
        return
      }

      const typeLabel = payload.type.toLowerCase().replace('_', ' ')
      const reason = `${payload.consecutiveDays} consecutive day(s) of ${typeLabel} deviation (${payload.severity})`

      const escalation = await this.prisma.escalationEvent.create({
        data: {
          alertId: payload.alertId,
          userId: payload.userId,
          escalationLevel: 'LEVEL_3',
          reason,
        },
      })

      await this.prisma.deviationAlert.update({
        where: { id: payload.alertId },
        data: { escalated: true },
      })

      this.logger.log(
        `Escalation LEVEL_3 created for alert ${payload.alertId}: ${reason}`,
      )

      this.eventEmitter.emit(JOURNAL_EVENTS.ESCALATION_CREATED, {
        userId: payload.userId,
        escalationEventId: escalation.id,
        alertId: payload.alertId,
        escalationLevel: 'LEVEL_3',
        deviationType: payload.type,
        reason,
      })
    } catch (error) {
      this.logger.error(
        `Escalation failed for alert ${payload.alertId}`,
        error instanceof Error ? error.stack : error,
      )
    }
  }
}
