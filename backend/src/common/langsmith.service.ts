import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client as LangSmithClient } from 'langsmith'

export interface LlmTraceData {
  model: string
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  latencyMs: number
  sessionId?: string
  source: 'text' | 'voice' | 'embedding' | 'emergency'
}

@Injectable()
export class LangSmithService implements OnModuleInit {
  private readonly logger = new Logger(LangSmithService.name)
  private client: LangSmithClient | null = null
  private project: string
  private enabled = false

  constructor(private readonly config: ConfigService) {
    this.project = this.config.get<string>('LANGSMITH_PROJECT') || 'healplace-cardio'
  }

  onModuleInit() {
    const apiKey = this.config.get<string>('LANGSMITH_API_KEY')
    if (!apiKey) {
      this.logger.warn('LANGSMITH_API_KEY not set — LLM tracing disabled')
      return
    }

    try {
      this.client = new LangSmithClient({ apiKey })
      this.enabled = true
      this.logger.log(`LangSmith tracing enabled → project: ${this.project}`)
    } catch (err) {
      this.logger.error('Failed to initialize LangSmith client', err)
    }
  }

  async traceRun(name: string, data: LlmTraceData): Promise<void> {
    if (!this.enabled || !this.client) return

    try {
      await this.client.createRun({
        name,
        run_type: 'llm',
        project_name: this.project,
        inputs: {
          model: data.model,
          source: data.source,
          sessionId: data.sessionId,
        },
        outputs: {
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          totalTokens: data.totalTokens,
        },
        extra: {
          latencyMs: data.latencyMs,
        },
        start_time: Date.now() - data.latencyMs,
        end_time: Date.now(),
      })
    } catch (err) {
      this.logger.warn(`Failed to log LangSmith trace: ${err}`)
    }
  }
}
