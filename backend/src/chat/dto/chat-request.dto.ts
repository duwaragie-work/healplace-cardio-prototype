import { IsNotEmpty, IsString, IsOptional } from 'class-validator'
import { SystemPromptConfig } from './system-prompt-config.dto.js'

export class ChatRequestDto implements SystemPromptConfig {
  @IsOptional()
  @IsString()
  sessionId?: string

  @IsNotEmpty({ message: 'prompt is required' })
  @IsString()
  prompt: string

  @IsOptional()
  @IsString()
  date: string
  medicalLens: string
  tone: string
  detailLevel: string
  careApproach: string
  spirituality: boolean
}
