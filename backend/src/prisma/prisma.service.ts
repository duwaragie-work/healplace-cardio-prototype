import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '../generated/prisma/client.js'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly configService: ConfigService

  constructor(configService: ConfigService) {
    super({
      accelerateUrl: configService.get<string>('DATABASE_URL')!,
    })
    this.configService = configService
  }

  async onModuleInit() {
    const dbUrl = this.configService.get<string>('DATABASE_URL') ?? '(not set)'
    const masked = dbUrl.replace(/:([^@]+)@/, ':***@')
    console.log(`🔌 Connecting to database: ${masked}`)
    try {
      await this.$connect()
    } catch (err) {
      console.error('❌ Database connection failed:', err)
      throw err
    }
    console.log('✅ Database connected')

    try {
      const enableVectorIndexSetup =
        this.configService.get<string>('ENABLE_VECTOR_INDEX_SETUP') === 'true' ||
        this.configService.get<string>('NODE_ENV') === 'production'

      if (!enableVectorIndexSetup) return

      await this.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`)

      await this.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "hnsw_index"
        ON "DocumentVector"
        USING hnsw ("embedding" vector_cosine_ops)
      `)
      console.log('✅ HNSW index verified/created')
    } catch (error) {
      console.warn(
        '⚠️  Failed to create HNSW index (might already be correct or extension missing):',
        error instanceof Error ? error.message : String(error),
      )
    }
  }
}
